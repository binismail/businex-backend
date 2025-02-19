const mongoose = require("mongoose");
const Payroll = require("../../models/payroll.model");
const Employee = mongoose.model("Employee");
const Transaction = require("../../models/transaction.model");
const Wallet = require("../../models/wallet.model");
const { generatePayslip } = require("../../utils/payslipGenerator");
const { processBankTransfer } = require("../../utils/bankTransfer");
const { calculateTax } = require("../../utils/taxCalculator");
const WalletService = require("../../services/walletService");

// Create a payroll record for an employee
exports.createPayroll = async (req, res) => {
  try {
    const { payrolls } = req.body; // Expecting an array of payrolls

    if (!payrolls || !Array.isArray(payrolls)) {
      return res.status(400).json({
        message: "Invalid payroll data. Expected an array of payrolls.",
      });
    }

    const createdPayrolls = [];

    // Loop through the array of payroll data
    for (const payrollData of payrolls) {
      const { employeeId, salary, deductions, bonuses } = payrollData;

      // Fetch employee to calculate net salary
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res
          .status(404)
          .json({ message: `Employee not found for ID: ${employeeId}` });
      }

      // Calculate net salary
      const netSalary = salary - (deductions || 0) + (bonuses || 0);

      // Create payroll record for each employee
      const newPayroll = new Payroll({
        employee: employeeId,
        salary,
        deductions,
        bonuses,
        net_salary: netSalary,
      });

      // Save payroll record
      await newPayroll.save();
      createdPayrolls.push(newPayroll); // Add created payroll to the array
    }

    // Send response with all created payrolls
    res.status(201).json({
      message: "Payroll records created successfully",
      payrolls: createdPayrolls,
    });
  } catch (error) {
    console.error("Payroll creation error:", error);
    res.status(400).json({
      message: "Error creating payroll records",
      error: error.message,
    });
  }
};

// Get all payroll records with filtering and pagination
exports.getAllPayrolls = async (req, res) => {
  try {
    const companyId = req.user.company;
    const {
      status,
      frequency,
      start_date,
      end_date,
      page = 1,
      limit = 10,
      sort_by = "period.start_date",
      sort_order = "desc",
    } = req.query;

    // Build query
    const query = { company: companyId };

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add frequency filter
    if (frequency) {
      query.frequency = frequency;
    }

    // Add date range filter
    if (start_date || end_date) {
      query["period.start_date"] = {};
      if (start_date) query["period.start_date"].$gte = new Date(start_date);
      if (end_date) query["period.start_date"].$lte = new Date(end_date);
    }

    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === "desc" ? -1 : 1;

    // Get total count for pagination
    const total = await Payroll.countDocuments(query);

    // Fetch payrolls
    const payrolls = await Payroll.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("payslips.employee", "name email department position")
      .select("-processing_history");

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      message: "Payrolls retrieved successfully",
      data: {
        payrolls,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: totalPages,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage,
        },
      },
    });
  } catch (error) {
    console.error("Payroll retrieval error:", error);
    res.status(500).json({
      message: "Error fetching payrolls",
      error: error.message,
    });
  }
};

// Get payroll by ID
exports.getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate({
        path: "payslips.employee",
        model: "Employee",
        select: "name email department",
      })
      .populate({
        path: "payslips.employee.department",
        model: "Department",
        select: "name",
      });

    if (!payroll)
      return res.status(404).json({ message: "Payroll record not found" });

    res.status(200).json(payroll);
  } catch (error) {
    console.error("Payroll retrieval error:", error);
    res.status(500).json({
      message: "Error fetching payroll record",
      error: error.message,
    });
  }
};

// Update payroll record (e.g., mark as paid, update deductions, etc.)
exports.updatePayroll = async (req, res) => {
  try {
    const { payrollId } = req.params;
    const { status, name, period, payslips } = req.body;
    const companyId = req.user.company;

    // Find the payroll and ensure it belongs to the company
    const payroll = await Payroll.findOne({
      _id: payrollId,
      company: companyId,
    });

    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    // Validate status changes
    const allowedStatusTransitions = {
      draft: ["pending"],
      pending: ["processing", "draft"],
      processing: ["completed", "failed"],
      completed: [],
      failed: ["draft", "pending"],
    };

    if (status) {
      const currentStatus = payroll.status;
      const validTransitions = allowedStatusTransitions[currentStatus] || [];

      if (!validTransitions.includes(status)) {
        return res.status(400).json({
          message: `Invalid status transition from ${currentStatus} to ${status}`,
          allowedTransitions: validTransitions,
        });
      }

      payroll.status = status;
      // Map main status to processing history status
      const processingHistoryStatusMap = {
        draft: "started",
        pending: "started",
        processing: "processing",
        completed: "completed",
        failed: "failed",
      };

      payroll.processing_history.push({
        status: processingHistoryStatusMap[status],
        message: `Status changed from ${currentStatus} to ${status}`,
        timestamp: new Date(),
      });
    }

    // Optional updates
    if (name) payroll.name = name;
    if (period) {
      if (period.start_date) payroll.period.start_date = period.start_date;
      if (period.end_date) payroll.period.end_date = period.end_date;
    }

    // Optionally update specific payslips if provided
    if (payslips && Array.isArray(payslips)) {
      payslips.forEach((updatedPayslip) => {
        const existingPayslipIndex = payroll.payslips.findIndex(
          (p) => p.employee.toString() === updatedPayslip.employee
        );

        if (existingPayslipIndex !== -1) {
          // Merge the updated payslip data
          payroll.payslips[existingPayslipIndex] = {
            ...payroll.payslips[existingPayslipIndex],
            ...updatedPayslip,
          };
        }
      });
    }

    // Recalculate summary if payslips are modified
    if (payslips) {
      payroll.summary = {
        total_gross: payroll.payslips.reduce(
          (sum, slip) => sum + slip.gross_pay,
          0
        ),
        total_deductions: payroll.payslips.reduce(
          (sum, slip) =>
            sum +
            slip.deductions.reduce((deductSum, d) => deductSum + d.amount, 0),
          0
        ),
        total_allowances: payroll.payslips.reduce(
          (sum, slip) =>
            sum +
            slip.allowances.reduce((allowSum, a) => allowSum + a.amount, 0),
          0
        ),
        total_net: payroll.payslips.reduce(
          (sum, slip) => sum + slip.net_pay,
          0
        ),
      };
    }

    await payroll.save();

    res.status(200).json({
      message: "Payroll updated successfully",
      payroll,
    });
  } catch (error) {
    console.error("Payroll update error:", error);
    res.status(400).json({
      message: "Error updating payroll record",
      error: error.message,
    });
  }
};

// Delete payroll record
exports.deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndDelete(req.params.id);
    if (!payroll)
      return res.status(404).json({ message: "Payroll record not found" });
    res.status(200).json({ message: "Payroll deleted successfully" });
  } catch (error) {
    console.error("Payroll deletion error:", error);
    res
      .status(500)
      .json({ message: "Error deleting payroll record", error: error.message });
  }
};

// Schedule a new payroll
exports.schedulePayroll = async (req, res) => {
  try {
    const { name, frequency, period_start, period_end, is_recurring } =
      req.body;

    const companyId = req.user.company;

    // Get all active employees for the company
    const employees = await Employee.find({
      company: companyId,
      status: "present",
    }).populate("department");

    if (!employees.length) {
      return res.status(400).json({
        message: "No active employees found",
      });
    }

    // Get company-wide deductions and allowances
    const deductions = await mongoose.model("Deduction").find({
      company: companyId,
      status: "active",
    });

    const extraEarnings = await mongoose.model("ExtraEarning").find({
      company: companyId,
      status: "active",
    });

    // Create payslips for each employee
    // In the schedulePayroll method, modify the payslips creation
    const payslips = await Promise.all(
      employees.map(async (employee) => {
        // Calculate base values
        const baseSalary = employee.salary || 0;

        // Calculate allowances (30% of base salary)
        const defaultAllowances = [
          {
            type: "transport",
            amount: Math.round(baseSalary * 0.15),
            description: "Transport Allowance",
          },
          {
            type: "housing",
            amount: Math.round(baseSalary * 0.15),
            description: "Housing Allowance",
          },
        ];

        // Add any extra earnings that apply to this employee or their department
        const applicableExtraEarnings = extraEarnings.filter((earning) => {
          return earning.applications.some((app) => {
            console.log("Extra Earning Application:", {
              earningName: earning.name,
              targetType: app.target_type,
              targetId: app.target_id,
              status: app.status,
              employeeId: employee._id,
              employeeDepartment: employee.department,
            });

            return (
              app.status === "active" &&
              ((app.target_type === "employee" &&
                app.target_id &&
                employee._id &&
                app.target_id === employee._id) ||
                (app.target_type === "department" &&
                  employee.department &&
                  app.target_id &&
                  app.target_id === employee.department._id))
            );
          });
        });

        console.log(
          "Applicable Extra Earnings:",
          applicableExtraEarnings.map((e) => e.name)
        );

        const extraAllowances = applicableExtraEarnings.map((earning) => ({
          type: earning.name,
          amount:
            earning.type === "fixed"
              ? earning.amount
              : Math.round(baseSalary * (earning.amount / 100)),
          description: earning.description,
        }));

        const allAllowances = [...defaultAllowances, ...extraAllowances];
        const totalAllowances = allAllowances.reduce(
          (sum, a) => sum + a.amount,
          0
        );

        // Calculate gross pay
        const grossPay = baseSalary + totalAllowances;

        // Calculate deductions
        const tax = calculateTax(grossPay).monthlyTax;
        const pension = Math.round(baseSalary * 0.08); // 8% pension contribution

        const defaultDeductions = [
          {
            type: "tax",
            amount: Math.round(tax),
            description: "PAYE Tax",
          },
          {
            type: "pension",
            amount: pension,
            description: "Pension Contribution",
          },
        ];

        // Add any applicable deductions for this employee or their department
        const applicableDeductions = deductions.filter((deduction) => {
          return deduction.applications.some((app) => {
            console.log("Deduction Application:", {
              deductionName: deduction.name,
              targetType: app.target_type,
              targetId: app.target_id,
              status: app.status,
              employeeId: employee._id,
              employeeDepartment: employee.department,
            });

            return (
              app.status === "active" &&
              ((app.target_type === "employee" &&
                app.target_id &&
                employee._id &&
                app.target_id === employee._id) ||
                (app.target_type === "department" &&
                  employee.department &&
                  app.target_id &&
                  app.target_id === employee.department._id))
            );
          });
        });

        console.log(
          "Applicable Deductions:",
          applicableDeductions.map((d) => d.name)
        );

        const extraDeductions = applicableDeductions.map((deduction) => ({
          type: deduction.name,
          amount:
            deduction.type === "fixed"
              ? deduction.amount
              : Math.round(baseSalary * (deduction.amount / 100)),
          description: deduction.description,
        }));

        const allDeductions = [...defaultDeductions, ...extraDeductions];
        const totalDeductions = allDeductions.reduce(
          (sum, d) => sum + d.amount,
          0
        );

        // Calculate net pay
        const netPay = grossPay - totalDeductions;

        return {
          employee: employee._id,
          base_salary: baseSalary,
          allowances: allAllowances,
          deductions: allDeductions,
          gross_pay: grossPay,
          net_pay: netPay,
          status: "pending",
        };
      })
    );

    // Calculate payroll summary
    const summary = payslips.reduce(
      (acc, slip) => ({
        total_gross: acc.total_gross + slip.gross_pay,
        total_deductions:
          acc.total_deductions +
          slip.deductions.reduce((sum, d) => sum + d.amount, 0),
        total_allowances:
          acc.total_allowances +
          slip.allowances.reduce((sum, a) => sum + a.amount, 0),
        total_net: acc.total_net + slip.net_pay,
      }),
      {
        total_gross: 0,
        total_deductions: 0,
        total_allowances: 0,
        total_net: 0,
      }
    );

    // Calculate next run date based on frequency
    const next_run = calculateNextRunDate(frequency, new Date(period_start));

    // Create the payroll
    const payroll = await Payroll.create({
      company: companyId,
      name,
      period: {
        start_date: period_start,
        end_date: period_end,
      },
      frequency,
      status: "draft",
      total_employees: employees.length,
      payslips,
      summary,
      schedule: {
        next_run,
        is_recurring: !!is_recurring,
        last_run: null,
      },
    });

    res.status(201).json({
      message: "Payroll scheduled successfully",
      payroll,
    });
  } catch (error) {
    console.error("Payroll scheduling error:", error);
    res.status(500).json({
      message: "Error scheduling payroll",
      error: error.message,
    });
  }
};

// Get payroll summary
exports.getPayrollSummary = async (req, res) => {
  try {
    const companyId = req.user.company;
    const { start_date, end_date } = req.query;

    // Build date filter
    const dateFilter = {};
    if (start_date)
      dateFilter["period.start_date"] = { $gte: new Date(start_date) };
    if (end_date) dateFilter["period.end_date"] = { $lte: new Date(end_date) };

    // Get payrolls grouped by status
    const payrollStats = await Payroll.aggregate([
      {
        $match: {
          company: companyId,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total_amount: { $sum: "$summary.total_net" },
        },
      },
    ]);

    // Format stats into a more usable structure
    const summary = {
      draft: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      processing: { count: 0, amount: 0 },
      completed: { count: 0, amount: 0 },
      failed: { count: 0, amount: 0 },
    };

    payrollStats.forEach((stat) => {
      summary[stat._id] = {
        count: stat.count,
        amount: stat.total_amount,
      };
    });

    // Get upcoming scheduled payrolls
    const upcomingPayrolls = await Payroll.find({
      company: companyId,
      "schedule.next_run": { $gt: new Date() },
    })
      .sort({ "schedule.next_run": 1 })
      .limit(5);

    res.status(200).json({
      summary,
      upcoming_payrolls: upcomingPayrolls,
    });
  } catch (error) {
    console.error("Payroll summary error:", error);
    res.status(500).json({
      message: "Error fetching payroll summary",
      error: error.message,
    });
  }
};

// Process a payroll
exports.processPayroll = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { payrollId } = req.params;
    const companyId = req.user.company;

    // Find the specific payroll
    const payroll = await Payroll.findOne({
      _id: payrollId,
      company: companyId,
    }).session(session);

    // Check if payroll exists
    if (!payroll) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Payroll not found",
      });
    }

    // Check wallet balance before processing
    const wallet = await Wallet.findOne({ company: companyId }).session(
      session
    );
    if (!wallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Company wallet not found",
      });
    }

    // Calculate total payroll amount
    const totalPayrollAmount = payroll.payslips.reduce(
      (total, payslip) => total + payslip.net_pay,
      0
    );

    // Check if wallet has sufficient balance
    if (wallet.wallet.availableBalance < totalPayrollAmount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Insufficient wallet balance",
        requiredAmount: totalPayrollAmount,
        currentBalance: wallet.wallet.availableBalance,
      });
    }

    // Check if payroll can be processed
    if (payroll.status !== "pending") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Cannot process payroll in ${payroll.status} status`,
      });
    }

    // Update payroll status to processing
    payroll.status = "processing";
    payroll.processing_history.push({
      status: "started",
      message: "Started payroll processing",
      timestamp: new Date(),
    });
    await payroll.save({ session });

    // Prepare transfer results
    const transferResults = [];
    const failedTransfers = [];

    // Process transfers for each payslip
    for (const payslip of payroll.payslips) {
      try {
        // Fetch employee details
        const employee = await Employee.findById(payslip.employee).session(
          session
        );

        console.log(employee.bankDetails);

        // Validate bank details
        if (!employee.bankDetails || !employee.bankDetails.accountNumber) {
          throw new Error(
            `No bank account details for employee ${employee.name}`
          );
        }

        // Prepare transfer details
        const transferDetails = {
          amount: payslip.net_pay,
          sortCode: employee.bankDetails.bankCode,
          accountNumber: employee.bankDetails.accountNumber,
          accountName: employee.bankDetails.accountName,
          companyId: companyId,
          employeeId: employee._id,
          metadata: {
            payrollId: payrollId,
            payslipId: payslip._id,
            payPeriod: payroll.pay_period,
          },
        };

        // Perform bank transfer
        const transferResult = await WalletService.transferToBank(
          transferDetails
        );

        // Update payslip status
        payslip.status = transferResult.success ? "completed" : "failed";
        payslip.transaction = transferResult.transaction._id;

        transferResults.push(transferResult);

        if (!transferResult.success) {
          failedTransfers.push(transferResult);
        }
      } catch (payslipError) {
        console.error(
          `Error processing payslip for employee ${payslip.employee}:`,
          payslipError
        );

        // Mark payslip as failed
        payslip.status = "failed";
        payslip.error = payslipError.message;

        failedTransfers.push({
          employeeId: payslip.employee,
          error: payslipError.message,
        });
      }
    }

    // Determine overall payroll status
    payroll.status =
      failedTransfers.length === 0
        ? "completed"
        : failedTransfers.length === payroll.payslips.length
        ? "failed"
        : "partially_completed";

    // Update processing history
    payroll.processing_history.push({
      status: payroll.status,
      message: `Payroll processing ${payroll.status}`,
      failedTransfers: failedTransfers.length,
      timestamp: new Date(),
    });

    // Save updated payroll
    await payroll.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Prepare response
    res.status(200).json({
      message: "Payroll processed",
      status: payroll.status,
      totalPayslips: payroll.payslips.length,
      successfulTransfers: transferResults.filter((r) => r.success).length,
      failedTransfers: failedTransfers.length,
      payroll,
    });
  } catch (error) {
    // Abort transaction in case of error
    await session.abortTransaction();
    session.endSession();

    console.error("Payroll Processing Error:", error);
    res.status(500).json({
      message: "Failed to process payroll",
      error: error.message,
    });
  }
};

// Helper function to calculate next run date
function calculateNextRunDate(frequency, fromDate) {
  const date = new Date(fromDate);

  switch (frequency) {
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "bi-weekly":
      date.setDate(date.getDate() + 14);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
  }

  return date;
}

// Process payroll (old function)
exports.processPayrollOld = async (payrollData) => {
  try {
    const { companyId, payrolls } = payrollData;

    // Fetch company wallet balance
    const wallet = await Wallet.findOne({ company: companyId });
    if (!wallet) {
      return console.error("Company wallet not found");
    }

    // Calculate total payroll amount
    const totalAmount = payrolls.reduce((total, payroll) => {
      return total + payroll.netSalary;
    }, 0);

    // Check if the wallet has sufficient balance
    if (wallet.balance < totalAmount) {
      return console.error(
        "Insufficient wallet balance for payroll processing"
      );
    }

    // Process payrolls for each employee
    for (let payrollData of payrolls) {
      const { employeeId, salary, deductions, bonuses, netSalary } =
        payrollData;

      // Fetch employee
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return console.error(`Employee not found: ${employeeId}`);
      }

      // Process bank transfer (via your bank transfer API)
      const transferResult = await processBankTransfer(
        employee.bankAccount,
        netSalary
      );
      if (!transferResult.success) {
        return console.error(
          `Failed to transfer payroll for employee: ${employee.name}`
        );
      }

      // Create payroll record, transaction, and payslip as described earlier
      const newPayroll = new Payroll({
        employee: employeeId,
        salary,
        deductions,
        bonuses,
        netSalary,
        status: "processed",
      });
      await newPayroll.save();

      const transaction = new Transaction({
        employee: employeeId,
        amount: netSalary,
        type: "debit",
        status: "successful",
        description: "Monthly payroll",
      });
      await transaction.save();

      const payslip = await generatePayslip(newPayroll, employee);
      newPayroll.pay_slip = payslip;
      await newPayroll.save();

      console.log(`Payroll processed for employee: ${employee.name}`);
    }

    // Deduct from wallet
    wallet.balance -= totalAmount;
    await wallet.save();

    console.log(`Payroll processed for company: ${companyId}`);
  } catch (error) {
    console.error("Error processing payroll:", error.message);
  }
};

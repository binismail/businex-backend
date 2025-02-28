const mongoose = require("mongoose");
const Payroll = require("../../models/payroll.model");
const Employee = mongoose.model("Employee");
const Transaction = require("../../models/transaction.model");
const Wallet = require("../../models/wallet.model");
const { generatePayslip } = require("../../utils/payslipGenerator");
const { processBankTransfer } = require("../../utils/bankTransfer");
const { calculateTax } = require("../../utils/taxCalculator");
const WalletService = require("../../services/walletService");
const emailService = require("../../utils/email");

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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { payrollId } = req.params;
    const companyId = req.user.company;

    // Find the payroll and ensure it belongs to the company
    const payroll = await Payroll.findOne({
      _id: payrollId,
      company: companyId,
    }).session(session);

    if (!payroll) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Payroll record not found" });
    }

    // Check if payroll can be deleted
    if (payroll.status === "completed") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Cannot delete a completed payroll",
        status: payroll.status,
      });
    }

    // Delete the payroll
    await Payroll.findByIdAndDelete(payrollId).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Payroll deleted successfully",
      details: {
        id: payroll._id,
        name: payroll.name,
        period: payroll.period,
        status: payroll.status,
      },
    });
  } catch (error) {
    console.error("Payroll deletion error:", error);
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      message: "Error deleting payroll record",
      error: error.message,
    });
  }
};

// Schedule a new payroll
exports.schedulePayroll = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

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

    // Function to create payslips for a given period
    const createPayslipsForPeriod = async (startDate, endDate, periodName) => {
      const payslips = await Promise.all(
        employees.map(async (employee) => {
          // Calculate base values
          const baseSalary = employee.salary || 0;

          // Calculate allowances (30% of base salary)
          const defaultAllowances = [
            {
              type: "transport",
              amount: 0,
              description: "Transport Allowance",
            },
            {
              type: "housing",
              amount: 0,
              description: "Housing Allowance",
            },
          ];

          // Add any extra earnings that apply to this employee or their department
          const applicableExtraEarnings = extraEarnings.filter((earning) => {
            return earning.applications.some((app) => {
              if (app.status !== "active") return false;

              const currentDate = new Date();
              if (app.start_date > currentDate) return false;
              if (app.end_date && app.end_date < currentDate) return false;

              if (app.target_type === "employee") {
                return app.target_id.toString() === employee._id.toString();
              }

              if (app.target_type === "department") {
                const departmentId =
                  employee.department?._id || employee.department;
                return (
                  departmentId &&
                  app.target_id.toString() === departmentId.toString()
                );
              }

              return false;
            });
          });

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
          const pension = Math.round(baseSalary * 0.08);

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

          // Add applicable deductions
          const applicableDeductions = deductions.filter((deduction) => {
            return deduction.applications.some((app) => {
              if (app.status !== "active") return false;

              const currentDate = new Date();
              if (app.start_date > currentDate) return false;
              if (app.end_date && app.end_date < currentDate) return false;

              if (app.target_type === "employee") {
                return app.target_id.toString() === employee._id.toString();
              }

              if (app.target_type === "department") {
                const departmentId =
                  employee.department?._id || employee.department;
                return (
                  departmentId &&
                  app.target_id.toString() === departmentId.toString()
                );
              }

              return false;
            });
          });

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

      // Create payroll document
      const payroll = new Payroll({
        company: companyId,
        name: periodName,
        period: {
          start_date: startDate,
          end_date: endDate,
        },
        frequency,
        total_employees: employees.length,
        payslips,
        summary,
        status: "draft",
      });

      return payroll;
    };

    const payrolls = [];
    const startDate = new Date(period_start);
    const endDate = new Date(period_end);
    const currentYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const paymentDay = startDate.getDate();

    // If recurring, create payrolls for all months including current month
    if (is_recurring) {
      // Create payrolls for current month through December in chronological order
      for (let month = startMonth; month < 12; month++) {
        // For monthly payroll, period should be entire month
        let periodStartDate = new Date(currentYear, month, 1); // First day of month
        let periodEndDate = new Date(currentYear, month + 1, 0); // Last day of month
        let processDate = new Date(currentYear, month, paymentDay); // Payment/process date

        // For the first month, respect the start date provided
        if (month === startMonth) {
          periodStartDate = new Date(startDate);
        }

        // If it's not monthly frequency, adjust the periods
        if (frequency === "bi-weekly") {
          // Two-week period starting from payment day
          periodStartDate =
            month === startMonth
              ? new Date(startDate)
              : new Date(currentYear, month, paymentDay);
          periodEndDate = new Date(periodStartDate);
          periodEndDate.setDate(periodStartDate.getDate() + 13);
        } else if (frequency === "weekly") {
          // One-week period starting from payment day
          periodStartDate =
            month === startMonth
              ? new Date(startDate)
              : new Date(currentYear, month, paymentDay);
          periodEndDate = new Date(periodStartDate);
          periodEndDate.setDate(periodStartDate.getDate() + 6);
        }

        const monthName = periodStartDate.toLocaleString("default", {
          month: "long",
        });
        const periodName = `${name} - ${monthName} ${currentYear}`;

        const recurringPayroll = await createPayslipsForPeriod(
          periodStartDate,
          periodEndDate,
          periodName
        );

        // Add process date to payroll
        recurringPayroll.schedule = {
          process_date: processDate,
          is_recurring: true,
        };

        payrolls.push(recurringPayroll);
      }
    } else {
      // For non-recurring, just create the initial payroll
      const initialPayroll = await createPayslipsForPeriod(
        startDate,
        endDate,
        name
      );
      payrolls.push(initialPayroll);
    }

    // Save all payrolls
    await Payroll.insertMany(payrolls, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: is_recurring
        ? `Created ${payrolls.length} recurring payrolls for the year`
        : "Payroll scheduled successfully",
      data: {
        payrolls: payrolls.map((p) => ({
          id: p._id,
          name: p.name,
          period: p.period,
          total_employees: p.total_employees,
          summary: p.summary,
        })),
      },
    });
  } catch (error) {
    console.error("Schedule payroll error:", error);
    await session.abortTransaction();
    session.endSession();

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

  const newPayroll = await Payroll.findOne({
    _id: req.params.payrollId,
    company: req.user.company,
  }).session(session);

  try {
    const { payrollId } = req.params;
    const companyId = req.user.company;

    // Find the specific payroll
    const payroll = await Payroll.findOne({
      _id: payrollId,
      company: companyId,
    })
      .populate("company")
      .session(session);

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

      // Send low balance alert
      await emailService.sendLowBalanceAlert({
        adminEmail: req.user.email,
        currentBalance: wallet.wallet.availableBalance,
        upcomingPayroll: totalPayrollAmount,
        walletUrl: `${process.env.FRONTEND_URL}/wallet`,
      });

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

        if (!employee.bankDetails || !employee.bankDetails.accountNumber) {
          throw new Error(
            `No bank account details for employee ${employee.name}`
          );
        }

        // Skip if payslip is already completed
        if (payslip.status === "completed") {
          continue;
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
            payPeriod: payroll.period,
          },
        };

        // Process bank transfer
        const transferResult = await WalletService.transferToBank(
          transferDetails
        );

        if (!transferResult.success) {
          throw new Error(transferResult.error || "Transfer failed");
        }

        // Update payslip status and add transaction reference
        payslip.status = "completed";
        payslip.transaction = transferResult.transaction._id;
        payslip.payment_reference = transferResult.reference;
        payslip.payment_date = new Date();
        payslip.retry_count = payslip.retry_count || 0;

        // Generate unique reference
        const moreReference = `transfer_${Date.now()}_${accountNumber}`;
        console.log(`More reference:`, moreReference);

        // Create transaction record
        const transaction = new Transaction({
          amount: payslip.net_pay,
          type: "debit",
          status: "successful",
          reference: transferResult.reference || moreReference,
          metadata: {
            payrollId: payrollId,
            payslipId: payslip._id,
            employeeId: employee._id,
            employeeName: employee.name,
            payPeriod: payroll.period,
          },
        });
        await transaction.save({ session });

        transferResults.push({
          employee: employee._id,
          amount: payslip.net_pay,
          status: "success",
          reference: transferResult.reference || moreReference,
        });
      } catch (error) {
        console.error("Transfer failed:", error);

        // Update payslip status to failed
        payslip.status = "failed";
        payslip.error_message = error.message;
        payslip.retry_count = (payslip.retry_count || 0) + 1;
        payslip.last_retry = new Date();

        failedTransfers.push({
          employee: payslip.employee,
          amount: payslip.net_pay,
          error: error.message,
          retryCount: payslip.retry_count,
        });
      }
    }

    // Update payroll status based on transfer results
    if (failedTransfers.length === 0) {
      // Update wallet balance
      wallet.wallet.availableBalance -= totalPayrollAmount;
      await wallet.save({ session });

      payroll.status = "completed";
      payroll.processing_history.push({
        status: "completed",
        message: "All transfers completed successfully",
        timestamp: new Date(),
        totalAmount: totalPayrollAmount,
        employeeCount: payroll.payslips.length,
      });

      // Send success email
      await emailService.sendPayrollProcessedEmail({
        adminEmail: req.user.email,
        adminName: req.user.firstName,
        period: payroll.period,
        totalAmount: totalPayrollAmount,
        employeeCount: payroll.payslips.length,
        processDate: new Date(),
        dashboardUrl: `${process.env.FRONTEND_URL}/payroll/${payroll._id}`,
      });

      // Send payslip emails to employees
      for (const payslip of payroll.payslips) {
        const employee = await Employee.findById(payslip.employee);
        if (employee && employee.email) {
          await emailService.sendPayslipEmail({
            employeeEmail: employee.email,
            employeeName: employee.name,
            period: payroll.period,
            netPay: payslip.net_pay,
            payslipUrl: `${process.env.FRONTEND_URL}/payslips/${payroll._id}`,
          });
        }
      }
    } else {
      // Set payroll status to partially_completed if some transfers succeeded
      const hasSuccessfulTransfers = payroll.payslips.some(
        (p) => p.status === "completed"
      );
      payroll.status = hasSuccessfulTransfers
        ? "partially_completed"
        : "failed";

      payroll.processing_history.push({
        status: payroll.status,
        message: `${failedTransfers.length} transfers failed`,
        timestamp: new Date(),
        failedTransfers: failedTransfers.map((f) => ({
          employee: f.employee,
          amount: f.amount,
          error: f.error,
          retryCount: f.retryCount,
        })),
      });

      // Send failure email
      await emailService.sendPayrollFailedEmail({
        adminEmail: req.user.email,
        adminName: req.user.firstName,
        period: payroll.period,
        errorMessage: `${failedTransfers.length} transfers failed. Please check the dashboard for details.`,
        dashboardUrl: `${process.env.FRONTEND_URL}/payroll/${payroll._id}`,
      });
    }

    await payroll.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Payroll processing completed",
      status: payroll.status,
      transferResults,
      failedTransfers,
    });
  } catch (error) {
    console.error("Payroll processing error:", error);
    await session.abortTransaction();
    session.endSession();

    // Send failure email for system errors
    await emailService.sendPayrollFailedEmail({
      adminEmail: req.user.email,
      adminName: req.user.firstName,
      period: newPayroll?.period || "current period",
      errorMessage: `System error: ${error.message}`,
      dashboardUrl: `${process.env.FRONTEND_URL}/payroll/${newPayroll?._id}`,
    });

    res.status(500).json({
      message: "Error processing payroll",
      error: error.message,
    });
  }
};

// Retry failed payslip transfer
exports.retryPayslipTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { payrollId, payslipId } = req.params;
    const companyId = req.user.company;

    // Find the payroll and specific payslip
    const payroll = await Payroll.findOne({
      _id: payrollId,
      company: companyId,
    }).session(session);

    if (!payroll) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Payroll not found",
      });
    }

    const payslip = payroll.payslips.id(payslipId);
    if (!payslip) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Payslip not found",
      });
    }

    // Check if payslip needs retry
    if (payslip.status === "completed") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Payslip has already been processed successfully",
      });
    }

    // Check wallet balance
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

    // Verify sufficient balance
    if (wallet.wallet.availableBalance < payslip.net_pay) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Insufficient wallet balance",
        requiredAmount: payslip.net_pay,
        currentBalance: wallet.wallet.availableBalance,
      });
    }

    // Fetch employee details
    const employee = await Employee.findById(payslip.employee).session(session);
    if (!employee) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    if (!employee.bankDetails || !employee.bankDetails.accountNumber) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `No bank account details for employee ${employee.name}`,
      });
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
        payPeriod: payroll.period,
        retryAttempt: (payslip.retry_count || 0) + 1,
      },
    };

    // Process bank transfer
    const transferResult = await WalletService.transferToBank(transferDetails);

    if (!transferResult.success) {
      // Increment retry count
      payslip.retry_count = (payslip.retry_count || 0) + 1;
      payslip.last_retry = new Date();
      await payroll.save({ session });

      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Transfer failed",
        error: transferResult.error,
      });
    }

    // Update payslip
    payslip.status = "completed";
    payslip.transaction = transferResult.transaction._id;
    payslip.payment_reference = transferResult.reference;
    payslip.payment_date = new Date();
    payslip.retry_count = (payslip.retry_count || 0) + 1;
    payslip.last_retry = new Date();

    // Create transaction record
    const transaction = new Transaction({
      amount: payslip.net_pay,
      type: "debit",
      status: "success",
      reference: transferResult.reference,
      metadata: {
        payrollId: payrollId,
        payslipId: payslip._id,
        employeeId: employee._id,
        employeeName: employee.name,
        payPeriod: payroll.period,
        retryAttempt: payslip.retry_count,
      },
    });
    await transaction.save({ session });

    // Update wallet balance
    wallet.wallet.availableBalance -= payslip.net_pay;
    await wallet.save({ session });

    // Update payroll status if all payslips are now completed
    const allCompleted = payroll.payslips.every(
      (p) => p.status === "completed"
    );
    if (allCompleted) {
      payroll.status = "completed";
      payroll.processing_history.push({
        status: "completed",
        message: "All transfers completed successfully after retries",
        timestamp: new Date(),
      });
    }

    await payroll.save({ session });

    // Send success notifications
    await emailService.sendPayslipEmail({
      employeeEmail: employee.email,
      employeeName: employee.name,
      period: payroll.period,
      netPay: payslip.net_pay,
      payslipUrl: `${process.env.FRONTEND_URL}/payslips/${payroll._id}`,
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Transfer retry successful",
      payslip: {
        id: payslip._id,
        status: payslip.status,
        payment_reference: payslip.payment_reference,
        retry_count: payslip.retry_count,
      },
    });
  } catch (error) {
    console.error("Payslip retry error:", error);
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      message: "Error retrying payslip transfer",
      error: error.message,
    });
  }
};

// Remove employee from payroll
exports.removeEmployeeFromPayroll = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { payrollId, employeeId } = req.params;
    const companyId = req.user.company;

    // Find the payroll
    const payroll = await Payroll.findOne({
      _id: payrollId,
      company: companyId,
    }).session(session);

    if (!payroll) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Payroll not found",
      });
    }

    // Check if payroll can be modified
    if (payroll.status !== "draft" && payroll.status !== "pending") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Cannot modify payroll in ${payroll.status} status`,
      });
    }

    // Find the payslip for this employee
    const payslipIndex = payroll.payslips.findIndex(
      (p) => p.employee.toString() === employeeId
    );

    if (payslipIndex === -1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Employee not found in this payroll",
      });
    }

    // Get the payslip to calculate summary adjustments
    const payslip = payroll.payslips[payslipIndex];

    // Remove the payslip
    payroll.payslips.splice(payslipIndex, 1);

    // Update total employees count
    payroll.total_employees = payroll.payslips.length;

    // Recalculate payroll summary
    const summary = payroll.payslips.reduce(
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

    // Update summary
    payroll.summary = summary;

    // Save changes
    await payroll.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Get employee details for the response

    const employee = await Employee.findById(employeeId).select("name email");

    res.status(200).json({
      message: "Employee removed from payroll successfully",
      data: {
        employee: {
          id: employeeId,
          name: employee?.name,
        },
        removedPayslip: {
          gross_pay: payslip.gross_pay,
          net_pay: payslip.net_pay,
          allowances: payslip.allowances.length,
          deductions: payslip.deductions.length,
        },
        updatedPayroll: {
          id: payroll._id,
          total_employees: payroll.total_employees,
          summary: payroll.summary,
        },
      },
    });
  } catch (error) {
    console.error("Remove employee from payroll error:", error);
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      message: "Error removing employee from payroll",
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

// Get payrolls
exports.getPayrolls = async (req, res) => {
  try {
    const companyId = req.user.company;
    const { page = 1, limit = 20 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { "period.start_date": 1 }, // Sort by start date in ascending order
      populate: [
        {
          path: "payslips.employee",
          select: "name email department position",
        },
      ],
    };

    const payrolls = await Payroll.paginate({ company: companyId }, options);

    res.status(200).json({
      message: "Payrolls retrieved successfully",
      data: payrolls,
    });
  } catch (error) {
    console.error("Get payrolls error:", error);
    res.status(500).json({
      message: "Error retrieving payrolls",
      error: error.message,
    });
  }
};

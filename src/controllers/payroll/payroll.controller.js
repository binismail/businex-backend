const mongoose = require("mongoose");
const Payroll = require("../../models/payroll.model");
const Employee = mongoose.model("Employee");
const Transaction = require("../../models/transaction.model");
const { generatePayslip } = require("../../utils/payslipGenerator");
const { processBankTransfer } = require("../../utils/bankTransfer");
const { calculateTax } = require("../../utils/taxCalculator");

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
    const payroll = await Payroll.findById(req.params.id).populate(
      "employee",
      "name email"
    );
    if (!payroll)
      return res.status(404).json({ message: "Payroll record not found" });
    res.status(200).json(payroll);
  } catch (error) {
    console.error("Payroll retrieval error:", error);
    res
      .status(500)
      .json({ message: "Error fetching payroll record", error: error.message });
  }
};

// Update payroll record (e.g., mark as paid, update deductions, etc.)
exports.updatePayroll = async (req, res) => {
  try {
    const { salary, deductions, bonuses, status, pay_slip } = req.body;

    const payroll = await Payroll.findById(req.params.id);
    if (!payroll)
      return res.status(404).json({ message: "Payroll record not found" });

    // Update fields
    payroll.salary = salary || payroll.salary;
    payroll.deductions = deductions || payroll.deductions;
    payroll.bonuses = bonuses || payroll.bonuses;
    payroll.net_salary = payroll.salary - payroll.deductions + payroll.bonuses;
    payroll.status = status || payroll.status;
    payroll.pay_slip = pay_slip || payroll.pay_slip;

    await payroll.save();
    res.status(200).json({ message: "Payroll updated successfully", payroll });
  } catch (error) {
    console.error("Payroll update error:", error);
    res
      .status(400)
      .json({ message: "Error updating payroll record", error: error.message });
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
          return earning.applications.some(
            (app) =>
              app.status === "active" &&
              ((app.target_type === "Employee" &&
                app.target_id.equals(employee._id)) ||
                (app.target_type === "Department" &&
                  employee.department &&
                  app.target_id.equals(employee.department._id)))
          );
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
          return deduction.applications.some(
            (app) =>
              app.status === "active" &&
              ((app.target_type === "Employee" &&
                app.target_id.equals(employee._id)) ||
                (app.target_type === "Department" &&
                  employee.department &&
                  app.target_id.equals(employee.department._id)))
          );
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
  try {
    const { payrollId } = req.params;
    const companyId = req.user.company;

    const payroll = await Payroll.findOne({
      _id: payrollId,
      company: companyId,
    });

    if (!payroll) {
      return res.status(404).json({
        message: "Payroll not found",
      });
    }

    if (payroll.status !== "pending") {
      return res.status(400).json({
        message: `Cannot process payroll in ${payroll.status} status`,
      });
    }

    // Update payroll status to processing
    payroll.status = "processing";
    payroll.processing_history.push({
      status: "started",
      message: "Started payroll processing",
    });
    await payroll.save();

    // Process each payslip
    let totalGross = 0;
    let totalDeductions = 0;
    let totalAllowances = 0;
    let totalNet = 0;

    for (const payslip of payroll.payslips) {
      try {
        // Get employee details
        const employee = await Employee.findById(payslip.employee);

        // Calculate deductions (tax, etc.)
        const tax = calculateTax(employee.salary);

        // Add tax deduction
        payslip.deductions.push({
          type: "tax",
          amount: tax,
          description: "Income Tax",
        });

        // Calculate totals
        const totalDeduction = payslip.deductions.reduce(
          (sum, d) => sum + d.amount,
          0
        );
        const totalAllowance = payslip.allowances.reduce(
          (sum, a) => sum + a.amount,
          0
        );

        payslip.gross_pay = employee.salary + totalAllowance;
        payslip.net_pay = payslip.gross_pay - totalDeduction;
        payslip.status = "completed";

        // Update running totals
        totalGross += payslip.gross_pay;
        totalDeductions += totalDeduction;
        totalAllowances += totalAllowance;
        totalNet += payslip.net_pay;
      } catch (error) {
        payslip.status = "failed";
        console.error(
          `Error processing payslip for employee ${payslip.employee}:`,
          error
        );
      }
    }

    // Update payroll summary
    payroll.summary = {
      total_gross: totalGross,
      total_deductions: totalDeductions,
      total_allowances: totalAllowances,
      total_net: totalNet,
    };

    // Update payroll status
    payroll.status = "completed";
    payroll.processing_history.push({
      status: "completed",
      message: "Payroll processing completed",
    });

    // If recurring, calculate next run date
    if (payroll.schedule.is_recurring) {
      payroll.schedule.last_run = new Date();
      payroll.schedule.next_run = calculateNextRunDate(
        payroll.frequency,
        payroll.schedule.last_run
      );
    }

    await payroll.save();

    res.status(200).json({
      message: "Payroll processed successfully",
      payroll,
    });
  } catch (error) {
    console.error("Payroll processing error:", error);
    res.status(500).json({
      message: "Error processing payroll",
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

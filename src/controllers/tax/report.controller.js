const TaxTransaction = require("../../models/taxTransaction.model");
const Employee = require("../../models/employees.model");
const mongoose = require("mongoose");

exports.getTaxSummary = async (req, res) => {
  try {
    const companyId = req.user.company;
    const { year, month } = req.query;

    // Validate year and month
    const currentYear = new Date().getFullYear();
    const parsedYear = parseInt(year);
    const parsedMonth = month ? parseInt(month) : null;

    if (!parsedYear || isNaN(parsedYear) || parsedYear < 2000 || parsedYear > currentYear + 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid year. Please provide a valid year between 2000 and " + (currentYear + 1)
      });
    }

    if (month && (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month. Please provide a valid month between 1 and 12"
      });
    }

    // Calculate date range
    const startDate = parsedMonth
      ? new Date(parsedYear, parsedMonth - 1, 1)
      : new Date(parsedYear, 0, 1);
    const endDate = parsedMonth 
      ? new Date(parsedYear, parsedMonth, 0) 
      : new Date(parsedYear, 11, 31);

    // Get all transactions within the period
    const transactions = await TaxTransaction.find({
      company: companyId,
      month: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // Calculate summary statistics
    const summary = {
      total_tax: 0,
      processed_tax: 0,
      pending_tax: 0,
      failed_tax: 0,
      total_transactions: transactions.length,
      status_breakdown: {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        late: 0,
      },
    };

    transactions.forEach((transaction) => {
      summary.total_tax += transaction.total_amount;
      summary.status_breakdown[transaction.status]++;

      transaction.breakdown.forEach((b) => {
        if (b.status === "processed") {
          summary.processed_tax += b.amount;
        } else if (b.status === "pending") {
          summary.pending_tax += b.amount;
        } else if (b.status === "failed") {
          summary.failed_tax += b.amount;
        }
      });
    });

    res.status(200).json({
      data: {
        period: {
          year: parsedYear,
          month: parsedMonth || "all",
        },
        summary,
        transactions: transactions.map((t) => ({
          id: t._id,
          month: t.month,
          status: t.status,
          total_amount: t.total_amount,
          processed_date: t.processed_date,
        })),
      },
    });
  } catch (error) {
    console.error("Tax summary error:", error);
    res.status(500).json({
      message: "Error generating tax summary",
      error: error.message,
    });
  }
};

exports.getEmployeeTaxHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const companyId = req.user.company;
    const { year } = req.query;

    // Validate year
    const currentYear = new Date().getFullYear();
    const parsedYear = parseInt(year);

    if (!parsedYear || isNaN(parsedYear) || parsedYear < 2000 || parsedYear > currentYear + 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid year. Please provide a valid year between 2000 and " + (currentYear + 1)
      });
    }

    // Verify employee belongs to company
    const employee = await Employee.findOne({
      _id: employeeId,
      company: companyId,
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // Get all transactions containing this employee
    const transactions = await TaxTransaction.find({
      company: companyId,
      "breakdown.employee": employeeId,
      month: {
        $gte: new Date(parsedYear, 0, 1),
        $lte: new Date(parsedYear, 11, 31),
      },
    });

    // Extract employee-specific tax history
    const taxHistory = [];
    let totalTaxPaid = 0;

    transactions.forEach((transaction) => {
      const employeeBreakdown = transaction.breakdown.find(
        (b) => b.employee.toString() === employeeId
      );

      if (employeeBreakdown) {
        taxHistory.push({
          transaction_id: transaction._id,
          month: transaction.month,
          amount: employeeBreakdown.amount,
          status: employeeBreakdown.status,
          payment_reference: employeeBreakdown.payment_reference,
          receipt_number: employeeBreakdown.receipt_number,
          tax_breakdown: employeeBreakdown.tax_breakdown,
        });

        if (employeeBreakdown.status === "processed") {
          totalTaxPaid += employeeBreakdown.amount;
        }
      }
    });

    res.status(200).json({
      data: {
        employee: {
          id: employee._id,
          name: employee.name,
          tax_pid: employee.tax_pid,
        },
        year: parsedYear,
        total_tax_paid: totalTaxPaid,
        tax_history: taxHistory,
      },
    });
  } catch (error) {
    console.error("Employee tax history error:", error);
    res.status(500).json({
      message: "Error retrieving employee tax history",
      error: error.message,
    });
  }
};

exports.getUpcomingTax = async (req, res) => {
  try {
    const companyId = req.user.company;

    // Get current date
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Get pending and processing transactions
    const upcomingTransactions = await TaxTransaction.find({
      company: companyId,
      status: { $in: ["pending", "processing"] },
      month: {
        $gte: currentMonth,
        $lt: nextMonth,
      },
    }).populate("breakdown.employee", "name email tax_pid");

    // Calculate totals
    const summary = {
      total_upcoming: 0,
      pending_count: 0,
      processing_count: 0,
      employee_count: 0,
    };

    upcomingTransactions.forEach((transaction) => {
      summary.total_upcoming += transaction.total_amount;
      if (transaction.status === "pending") summary.pending_count++;
      if (transaction.status === "processing") summary.processing_count++;
      summary.employee_count += transaction.breakdown.length;
    });

    res.status(200).json({
      data: {
        month: currentMonth,
        summary,
        transactions: upcomingTransactions.map((t) => ({
          id: t._id,
          status: t.status,
          total_amount: t.total_amount,
          employee_count: t.breakdown.length,
          breakdown: t.breakdown.map((b) => ({
            employee: {
              id: b.employee._id,
              name: b.employee.name,
              tax_pid: b.employee.tax_pid,
            },
            amount: b.amount,
            status: b.status,
          })),
        })),
      },
    });
  } catch (error) {
    console.error("Upcoming tax error:", error);
    res.status(500).json({
      message: "Error retrieving upcoming tax information",
      error: error.message,
    });
  }
};

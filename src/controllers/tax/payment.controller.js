const TaxTransaction = require("../../models/taxTransaction.model");
const TaxPid = require("../../models/taxPid.model");
const Employee = require("../../models/employees.model");
const paymentService = require("../../services/tax/paymentService");
const mongoose = require("mongoose");

exports.processTaxPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { taxTransactionId } = req.params;
    const companyId = req.user.company;

    // Find the tax transaction
    const taxTransaction = await TaxTransaction.findOne({
      _id: taxTransactionId,
      company: companyId,
      status: "pending",
    })
      .populate("payroll")
      .session(session);

    if (!taxTransaction) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Tax transaction not found or not in pending status",
      });
    }

    // Process each employee's tax payment
    const results = {
      successful: [],
      failed: [],
    };

    for (const breakdown of taxTransaction.breakdown) {
      try {
        // Get employee details
        const employee = await Employee.findById(breakdown.employee)
          .populate("company")
          .session(session);

        if (!employee || !employee.tax_pid) {
          throw new Error("Employee or PID not found");
        }

        // Process the tax payment
        const paymentResponse = await paymentService.processTaxPayment({
          pid: employee.tax_pid,
          amount: breakdown.amount,
          appliedDate: new Date(),
          email: employee.email,
          mobile: employee.phone,
        });

        if (paymentResponse.status === "SUCCESS") {
          breakdown.status = "processed";
          breakdown.payment_reference = paymentResponse.transaction.paymentRef;
          breakdown.receipt_number = paymentResponse.transaction.receiptNumber;

          results.successful.push({
            employee: employee._id,
            amount: breakdown.amount,
            reference: paymentResponse.transaction.paymentRef,
          });
        } else {
          throw new Error(paymentResponse.message || "Payment failed");
        }
      } catch (error) {
        console.error(
          `Tax payment failed for employee ${breakdown.employee}:`,
          error
        );
        breakdown.status = "failed";
        results.failed.push({
          employee: breakdown.employee,
          amount: breakdown.amount,
          error: error.message,
        });
      }
    }

    // Update transaction status based on results
    if (results.failed.length === 0) {
      taxTransaction.status = "completed";
    } else if (results.successful.length === 0) {
      taxTransaction.status = "failed";
    } else {
      taxTransaction.status = "partial";
    }

    taxTransaction.processed_date = new Date();
    taxTransaction.processing_history.push({
      status: taxTransaction.status,
      message: `Processed ${results.successful.length} successful and ${results.failed.length} failed payments`,
    });

    await taxTransaction.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Tax payment processing completed",
      data: {
        transaction_id: taxTransaction._id,
        status: taxTransaction.status,
        successful: results.successful,
        failed: results.failed,
      },
    });
  } catch (error) {
    console.error("Tax payment processing error:", error);
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      message: "Error processing tax payment",
      error: error.message,
    });
  }
};

exports.retryFailedPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { taxTransactionId, employeeId } = req.params;
    const companyId = req.user.company;

    // Find the tax transaction
    const taxTransaction = await TaxTransaction.findOne({
      _id: taxTransactionId,
      company: companyId,
    }).session(session);

    if (!taxTransaction) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Tax transaction not found",
      });
    }

    // Find the specific employee breakdown
    const breakdown = taxTransaction.breakdown.find(
      (b) => b.employee.toString() === employeeId && b.status === "failed"
    );

    if (!breakdown) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Failed payment not found for this employee",
      });
    }

    // Get employee details
    const employee = await Employee.findById(employeeId).session(session);

    if (!employee || !employee.tax_pid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Employee or PID not found",
      });
    }

    // Retry the payment
    const paymentResponse = await paymentService.processTaxPayment({
      pid: employee.tax_pid,
      amount: breakdown.amount,
      appliedDate: new Date(),
      email: employee.email,
      mobile: employee.phone,
    });

    if (paymentResponse.status !== "SUCCESS") {
      throw new Error(paymentResponse.message || "Payment retry failed");
    }

    // Update breakdown status
    breakdown.status = "processed";
    breakdown.payment_reference = paymentResponse.transaction.paymentRef;
    breakdown.receipt_number = paymentResponse.transaction.receiptNumber;

    // Update transaction status if all payments are now successful
    const allProcessed = taxTransaction.breakdown.every(
      (b) => b.status === "processed"
    );
    if (allProcessed) {
      taxTransaction.status = "completed";
    }

    taxTransaction.retry_count += 1;
    taxTransaction.last_retry = new Date();
    taxTransaction.processing_history.push({
      status: "retry_success",
      message: `Successfully retried payment for employee ${employee.name}`,
    });

    await taxTransaction.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Payment retry successful",
      data: {
        transaction_id: taxTransaction._id,
        status: taxTransaction.status,
        payment_reference: paymentResponse.transaction.paymentRef,
        receipt_number: paymentResponse.transaction.receiptNumber,
      },
    });
  } catch (error) {
    console.error("Payment retry error:", error);
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      message: "Error retrying payment",
      error: error.message,
    });
  }
};

exports.getTaxTransactionStatus = async (req, res) => {
  try {
    const { taxTransactionId } = req.params;
    const companyId = req.user.company;

    const taxTransaction = await TaxTransaction.findOne({
      _id: taxTransactionId,
      company: companyId,
    }).populate("breakdown.employee", "name email");

    if (!taxTransaction) {
      return res.status(404).json({
        message: "Tax transaction not found",
      });
    }

    res.status(200).json({
      data: {
        transaction_id: taxTransaction._id,
        status: taxTransaction.status,
        total_amount: taxTransaction.total_amount,
        processed_date: taxTransaction.processed_date,
        retry_count: taxTransaction.retry_count,
        breakdown: taxTransaction.breakdown.map((b) => ({
          employee: b.employee,
          amount: b.amount,
          status: b.status,
          payment_reference: b.payment_reference,
          receipt_number: b.receipt_number,
        })),
        processing_history: taxTransaction.processing_history,
      },
    });
  } catch (error) {
    console.error("Get transaction status error:", error);
    res.status(500).json({
      message: "Error retrieving transaction status",
      error: error.message,
    });
  }
};

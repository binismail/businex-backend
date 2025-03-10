const TaxTransaction = require("../../models/taxTransaction.model");
const Employee = require("../../models/employees.model");
const Wallet = require("../../models/wallet.model");
const paymentService = require("../../services/tax/paymentService");
const mongoose = require("mongoose");
const emailService = require("../../utils/email");

/**
 * Process tax payment for a transaction
 */
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

    // Check if wallet has sufficient balance
    if (wallet.wallet.availableBalance < taxTransaction.total_amount) {
      await session.abortTransaction();
      session.endSession();

      // Send low balance alert
      await emailService.sendLowBalanceAlert({
        adminEmail: req.user.email,
        currentBalance: wallet.wallet.availableBalance,
        upcomingPayroll: taxTransaction.total_amount,
        walletUrl: `${process.env.FRONTEND_URL}/wallet`,
      });

      return res.status(400).json({
        message: "Insufficient wallet balance for tax payment",
        requiredAmount: taxTransaction.total_amount,
        currentBalance: wallet.wallet.availableBalance,
      });
    }

    // Update transaction status to processing
    taxTransaction.status = "processing";
    taxTransaction.processing_history.push({
      status: "processing",
      message: "Started tax payment processing",
      timestamp: new Date(),
    });
    await taxTransaction.save({ session });

    // Process each employee's tax payment
    const results = {
      successful: [],
      failed: [],
    };

    for (const breakdown of taxTransaction.breakdown) {
      try {
        // Get employee details
        const employee = await Employee.findById(breakdown.employee)
          .select("name email phone tax_pid")
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
            name: employee.name,
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
    taxTransaction.status =
      results.failed.length === 0
        ? "completed"
        : results.successful.length === 0
        ? "failed"
        : "partial";

    taxTransaction.processed_date = new Date();
    taxTransaction.processing_history.push({
      status: taxTransaction.status,
      message: `Processed ${results.successful.length} successful and ${results.failed.length} failed payments`,
      timestamp: new Date(),
    });

    // Update wallet balance if all payments were successful
    if (taxTransaction.status === "completed") {
      wallet.wallet.availableBalance -= taxTransaction.total_amount;
      await wallet.save({ session });
    }

    await taxTransaction.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Tax payment processing completed",
      data: {
        transaction_id: taxTransaction._id,
        status: taxTransaction.status,
        processed_date: taxTransaction.processed_date,
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

/**
 * Get tax transaction status and details
 */
exports.getTaxTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const companyId = req.user.company;

    const transaction = await TaxTransaction.findOne({
      _id: transactionId,
      company: companyId,
    }).populate("breakdown.employee", "name email");

    if (!transaction) {
      return res.status(404).json({
        message: "Tax transaction not found",
      });
    }

    res.status(200).json({
      data: {
        transaction_id: transaction._id,
        status: transaction.status,
        processed_date: transaction.processed_date,
        total_amount: transaction.total_amount,
        breakdown: transaction.breakdown.map((b) => ({
          employee: {
            id: b.employee._id,
            name: b.employee.name,
            email: b.employee.email,
          },
          amount: b.amount,
          status: b.status,
          payment_reference: b.payment_reference,
          receipt_number: b.receipt_number,
        })),
        processing_history: transaction.processing_history,
      },
    });
  } catch (error) {
    console.error("Get tax transaction status error:", error);
    res.status(500).json({
      message: "Error retrieving tax transaction status",
      error: error.message,
    });
  }
};

const Wallet = require("../../models/wallet.model");
const Transaction = require("../../models/transaction.model");
const WalletService = require("../../services/walletService");
const logger = require("../../utils/customLogger");

class XpressWalletWebhookController {
  // Handle incoming webhooks from Xpress Wallet
  static async handleWebhook(req, res) {
    try {
      // Log the raw webhook payload for debugging
      logger.info(
        "Xpress Wallet Webhook Received: " +
          JSON.stringify({
            body: req.body,
            headers: req.headers,
          })
      );

      // Validate webhook
      if (!req.body || !req.body.data) {
        return res.status(400).json({
          message: "Invalid webhook payload",
        });
      }

      const payload = req.body.data;

      // Determine webhook type
      switch (payload.type) {
        case "wallet_credit":
          await this.handleWalletCredit(payload);
          break;
        case "wallet_debit":
          await this.handleWalletDebit(payload);
          break;
        case "bank_transfer":
          await this.handleBankTransfer(payload);
          break;
        default:
          logger.warn("Unhandled webhook type: " + payload.type);
      }

      // Always respond with 200 to acknowledge receipt
      return res.status(200).json({
        message: "Webhook processed successfully",
      });
    } catch (error) {
      // Log and handle any errors
      logger.error(
        "Webhook Processing Error: " +
          error.message +
          " Payload: " +
          JSON.stringify(req.body)
      );

      return res.status(500).json({
        message: "Error processing webhook",
        error: error.message,
      });
    }
  }

  // Handle wallet credit events
  static async handleWalletCredit(payload) {
    try {
      // Find wallet by customer ID
      const wallet = await Wallet.findOne({
        "wallet.walletId": payload.customer_id,
      });

      if (!wallet) {
        logger.warn("Wallet not found for credit: " + payload.customer_id);
        return;
      }

      // Create transaction record
      const transaction = new Transaction({
        wallet: wallet._id,
        company: wallet.company,
        amount: payload.amount,
        type: "wallet_credit",
        status: "successful",
        description: payload.narration || "Wallet Credit",
        transactionId: payload.transaction_id,
        reference: payload.reference,
        metadata: {
          source: "xpress_wallet_webhook",
          rawPayload: payload,
        },
      });

      await transaction.save();

      // Sync wallet balance
      await WalletService.syncWalletBalance(wallet.company);

      logger.info(
        `Wallet Credit Processed: Wallet ${wallet._id}, Amount ${payload.amount}`
      );
    } catch (error) {
      logger.error(
        "Wallet Credit Webhook Error: " +
          error.message +
          " Payload: " +
          JSON.stringify(payload)
      );
    }
  }

  // Handle wallet debit events
  static async handleWalletDebit(payload) {
    try {
      // Find wallet by customer ID
      const wallet = await Wallet.findOne({
        "wallet.walletId": payload.customer_id,
      });

      if (!wallet) {
        logger.warn("Wallet not found for debit: " + payload.customer_id);
        return;
      }

      // Create transaction record
      const transaction = new Transaction({
        wallet: wallet._id,
        company: wallet.company,
        amount: payload.amount,
        type: "wallet_debit",
        status: "successful",
        description: payload.narration || "Wallet Debit",
        transactionId: payload.transaction_id,
        reference: payload.reference,
        metadata: {
          source: "xpress_wallet_webhook",
          rawPayload: payload,
        },
      });

      await transaction.save();

      // Sync wallet balance
      await WalletService.syncWalletBalance(wallet.company);

      logger.info(
        `Wallet Debit Processed: Wallet ${wallet._id}, Amount ${payload.amount}`
      );
    } catch (error) {
      logger.error(
        "Wallet Debit Webhook Error: " +
          error.message +
          " Payload: " +
          JSON.stringify(payload)
      );
    }
  }

  // Handle bank transfer events
  static async handleBankTransfer(payload) {
    try {
      // Find transaction by reference or transaction ID
      const existingTransaction = await Transaction.findOne({
        $or: [
          { reference: payload.reference },
          { transactionId: payload.transaction_id },
        ],
      });

      if (existingTransaction) {
        // Update existing transaction status
        existingTransaction.status =
          payload.status === "successful" ? "successful" : "failed";
        existingTransaction.metadata = {
          ...existingTransaction.metadata,
          webhookPayload: payload,
        };

        await existingTransaction.save();

        logger.info(
          `Bank Transfer Transaction Updated: Reference ${payload.reference}, Status ${existingTransaction.status}`
        );
      } else {
        // Create new transaction if not found
        const transaction = new Transaction({
          type: "bank_transfer",
          amount: payload.amount,
          status: payload.status === "successful" ? "successful" : "failed",
          description: payload.narration || "Bank Transfer",
          transactionId: payload.transaction_id,
          reference: payload.reference,
          metadata: {
            source: "xpress_wallet_webhook",
            rawPayload: payload,
          },
        });

        await transaction.save();

        logger.warn("Unmatched Bank Transfer Webhook: " + payload.reference);
      }
    } catch (error) {
      logger.error(
        "Bank Transfer Webhook Error: " +
          error.message +
          " Payload: " +
          JSON.stringify(payload)
      );
    }
  }
}

module.exports = XpressWalletWebhookController;

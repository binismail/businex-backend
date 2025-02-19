const axios = require("axios");
const Company = require("../models/company.model");
const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");

class WalletService {
  static formatAxiosError(error) {
    // Helper method to format Axios errors cleanly
    if (error.response) {
      // The request was made and the server responded with a status code
      return {
        success: false,
        status: error.response.status,
        message: error.response.data.message || 'Unknown error occurred',
        details: {
          apiMessage: error.response.data.message,
          apiStatus: error.response.data.status,
          reference: error.config?.data ? JSON.parse(error.config.data).reference : null
        }
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        success: false,
        message: 'No response received from server',
        details: {
          requestMethod: error.config?.method,
          requestUrl: error.config?.url
        }
      };
    } else {
      // Something happened in setting up the request
      return {
        success: false,
        message: error.message || 'Error setting up the request',
        details: {
          errorName: error.name,
          errorMessage: error.message
        }
      };
    }
  }

  static async createWalletForCompany(companyId) {
    try {
      // Fetch company details
      const company = await Company.findById(companyId);

      if (!company) {
        throw new Error("Company not found");
      }

      // Prepare wallet creation payload
      const payload = {
        bvn: Math.floor(10000000000 + Math.random() * 90000000000).toString(),
        firstName: company.name.split(" ")[0],
        lastName: company.name.split(" ").slice(1).join(" "),
        phoneNumber: company.phone || "08000000000",
        dateOfBirth: "1990-01-01",
        email: company.email,
        address: company.address || "Not Provided",
        metadata: {
          companyId: company._id.toString(),
          companyName: company.name,
        },
      };

      console.log(`Bearer ${process.env.XPRESS_ACCESS_TOKEN}`);

      // Call Xpress Wallet API
      const response = await axios.post(
        "https://payment.xpress-wallet.com/api/v1/wallet",
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.XPRESS_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Create wallet record
      const wallet = new Wallet({
        company: companyId,
        customer: response.data.customer,
        wallet: response.data.wallet,
        status: "active",
      });

      await wallet.save();

      // Update company with wallet reference
      await Company.findByIdAndUpdate(companyId, {
        wallet: wallet._id,
      });

      return wallet;
    } catch (error) {
      console.error(
        "Wallet Creation Error:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  }

  // Get wallet balance for a company
  static async getWalletBalance(companyId) {
    const wallet = await Wallet.findOne({ company: companyId });
    return wallet ? wallet.wallet.availableBalance : 0;
  }

  // Transfer funds within wallet
  static async transferFunds(fromCompanyId, toCompanyId, amount) {
    try {
      const fromWallet = await Wallet.findOne({ company: fromCompanyId });
      const toWallet = await Wallet.findOne({ company: toCompanyId });

      if (!fromWallet || !toWallet) {
        throw new Error("One or both wallets not found");
      }

      if (fromWallet.wallet.availableBalance < amount) {
        throw new Error("Insufficient balance");
      }

      // In a real-world scenario, you'd use the Xpress Wallet API for transfers
      fromWallet.wallet.availableBalance -= amount;
      toWallet.wallet.availableBalance += amount;

      await fromWallet.save();
      await toWallet.save();

      return {
        success: true,
        message: "Transfer successful",
        fromBalance: fromWallet.wallet.availableBalance,
        toBalance: toWallet.wallet.availableBalance,
      };
    } catch (error) {
      console.error("Transfer Error:", error.message);
      throw error;
    }
  }

  // Sync wallet balance with Xpress Wallet
  static async syncWalletBalance(companyId, metadata = {}) {
    try {
      // Find the company wallet
      const wallet = await Wallet.findOne({
        company: companyId,
      });

      console.log(`Wallet found:`, wallet);

      if (!wallet) {
        console.error(`No wallet found for company ${companyId}`);
        return null;
      }

      // Validate customer ID
      if (!wallet.wallet || !wallet.customer.id) {
        console.error(
          `Invalid wallet configuration for company ${companyId}: Missing customer ID`
        );
        return null;
      }

      try {
        console.log(`Attempting to sync wallet for company ${companyId}`);
        console.log(`Customer ID: ${wallet.customer.id}`);

        const response = await axios.get(
          `https://payment.xpress-wallet.com/api/v1/wallet/customer`,
          {
            params: {
              customerId: wallet.customer.id,
            },
            headers: {
              Authorization: `Bearer ${process.env.XPRESS_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log(
          "Wallet Sync Response:",
          JSON.stringify(response.data, null, 2)
        );

        // Update wallet balance if successful
        if (response.data && response.data.wallet) {
          const walletData = response.data.wallet;

          // Update wallet details
          wallet.wallet.walletId = walletData.id;
          wallet.wallet.availableBalance = walletData.availableBalance || 0;
          wallet.wallet.bookedBalance = walletData.bookedBalance || 0;
          wallet.wallet.status = walletData.status;
          wallet.wallet.tier = walletData.tier;

          // Update additional wallet information
          wallet.wallet.accountName = walletData.accountName;
          wallet.wallet.accountNumber = walletData.accountNumber;
          wallet.wallet.bankName = walletData.bankName;
          wallet.wallet.bankCode = walletData.bankCode;

          // Add optional metadata
          wallet.wallet.balanceSyncMetadata = {
            ...metadata,
            lastSyncedAt: new Date(),
            rawResponse: response.data,
          };

          console.log(`Wallet balance updated for company ${companyId}`);
          await wallet.save();
        } else {
          console.warn(`No wallet data in response for company ${companyId}`);
        }

        return wallet;
      } catch (walletError) {
        console.error(
          `Wallet sync error for customer ${wallet.wallet.customerId}:`,
          walletError.response ? walletError.response.data : walletError.message
        );

        // Add sync error metadata
        wallet.wallet.balanceSyncMetadata = {
          ...metadata,
          lastSyncAttemptAt: new Date(),
          syncError: walletError.message,
        };

        await wallet.save();

        return wallet;
      }
    } catch (error) {
      console.error(
        `Wallet sync error for company ${companyId}:`,
        error.message
      );
      return null;
    }
  }

  // Credit wallet
  static async creditWallet(companyId, amount, metadata = {}) {
    try {
      // Find the company wallet
      const wallet = await Wallet.findOne({ company: companyId });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Validate customer ID
      if (!wallet.wallet || !wallet.customer.id) {
        throw new Error("Invalid wallet configuration: Missing customer ID");
      }

      // Generate unique reference
      const reference = metadata.reference || `credit_${Date.now()}_${companyId}`;

      // Prepare wallet credit payload
      const payload = {
        amount,
        reference,
        customerId: wallet.customer.id,
        metadata: {
          companyId: companyId,
          ...metadata,
        },
      };

      try {
        // Call Xpress Wallet Credit API
        const response = await axios.post(
          "https://payment.xpress-wallet.com/api/v1/wallet/credit",
          payload,
          {
            headers: {
              Authorization: `Bearer ${process.env.XPRESS_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Sync wallet balance to get updated balance
        const updatedWallet = await this.syncWalletBalance(companyId);

        // Create transaction record
        const transaction = new Transaction({
          company: companyId,
          wallet: wallet._id,
          amount,
          type: "wallet_credit",
          status: response.data.status === true ? "successful" : "failed",
          description: metadata.description || "Wallet Credit",
          transactionId: response.data.reference, // Using reference as transaction ID
          reference,
          metadata,
          balance_before: wallet.wallet.availableBalance,
          balance_after: updatedWallet.wallet.availableBalance,
        });

        await transaction.save();

        return {
          success: true,
          message: response.data.message || "Wallet credited successfully",
          reference,
          transaction,
          response: response.data,
        };
      } catch (apiError) {
        // Format and log the API error
        const formattedError = this.formatAxiosError(apiError);
        
        // Log the error for internal tracking
        console.error("Wallet Credit API Error:", JSON.stringify(formattedError, null, 2));
        
        // Throw a more user-friendly error
        throw new Error(formattedError.message);
      }
    } catch (error) {
      // Handle any other errors that might occur
      console.error("Wallet Credit Error:", error.message);
      throw error;
    }
  }

  // Debit wallet
  static async debitWallet(companyId, amount, metadata = {}) {
    try {
      // Find the company wallet
      const wallet = await Wallet.findOne({ company: companyId });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Validate customer ID
      if (!wallet.wallet || !wallet.customer.id) {
        throw new Error("Invalid wallet configuration: Missing customer ID");
      }

      // Check sufficient balance
      if (wallet.wallet.availableBalance < amount) {
        throw new Error("Insufficient wallet balance");
      }

      // Generate unique reference
      const reference = metadata.reference || `debit_${Date.now()}_${companyId}`;

      // Prepare wallet debit payload
      const payload = {
        amount,
        reference,
        customerId: wallet.customer.id,
        metadata: {
          companyId: companyId,
          ...metadata,
        },
      };

      try {
        // Call Xpress Wallet Debit API
        const response = await axios.post(
          "https://payment.xpress-wallet.com/api/v1/wallet/debit",
          payload,
          {
            headers: {
              Authorization: `Bearer ${process.env.XPRESS_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Sync wallet balance to get updated balance
        const updatedWallet = await this.syncWalletBalance(companyId);

        // Create transaction record
        const transaction = new Transaction({
          company: companyId,
          wallet: wallet._id,
          amount,
          type: "wallet_debit",
          status: response.data.status === true ? "successful" : "failed",
          description: metadata.description || "Wallet Debit",
          transactionId: response.data.data?.reference || reference,
          reference,
          metadata: {
            ...metadata,
            transactionFee: response.data.data?.transaction_fee,
          },
          balance_before: wallet.wallet.availableBalance,
          balance_after: updatedWallet.wallet.availableBalance,
        });

        await transaction.save();

        return {
          success: true,
          message: response.data.message || "Wallet debited successfully",
          reference,
          transaction,
          response: response.data,
        };
      } catch (apiError) {
        // Format and log the API error
        const formattedError = this.formatAxiosError(apiError);
        
        // Log the error for internal tracking
        console.error("Wallet Debit API Error:", JSON.stringify(formattedError, null, 2));
        
        // Throw a more user-friendly error
        throw new Error(formattedError.message);
      }
    } catch (error) {
      // Handle any other errors that might occur
      console.error("Wallet Debit Error:", error.message);
      throw error;
    }
  }

  // Bank Transfer Method
  static async transferToBank(transferDetails) {
    try {
      // Validate required fields
      const {
        amount,
        sortCode,
        accountNumber,
        accountName,
        companyId,
        employeeId,
        metadata = {},
      } = transferDetails;

      if (!amount || !sortCode || !accountNumber || !accountName) {
        throw new Error("Missing required transfer details");
      }

      // Generate unique reference
      const reference = `transfer_${Date.now()}_${accountNumber}`;

      // Prepare transfer payload
      const payload = {
        amount,
        sortCode,
        accountNumber,
        accountName,
        narration: metadata.narration || "Salary Payment",
        metadata: {
          companyId,
          employeeId,
          ...metadata,
        },
      };

      // Perform bank transfer via Xpress Wallet
      const response = await axios.post(
        "https://payment.xpress-wallet.com/api/v1/transfer/bank",
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.XPRESS_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Create transaction record
      const transaction = new Transaction({
        company: companyId,
        employee: employeeId,
        amount,
        type: "salary_credit",
        status: response.data.status === true ? "successful" : "failed",
        description: payload.narration,
        transactionId: response.data.transactionId,
        reference,
        metadata: {
          bankDetails: {
            sortCode,
            accountNumber,
            accountName,
          },
          ...metadata,
        },
      });

      await transaction.save();

      return {
        success: response.data.status === true,
        message: "Bank transfer processed",
        transaction,
        response: response.data,
      };
    } catch (error) {
      console.error(
        "Bank Transfer Error:",
        error.response ? error.response.data : error.message
      );

      // Create failed transaction record
      const failedTransaction = new Transaction({
        company: transferDetails.companyId,
        employee: transferDetails.employeeId,
        amount: transferDetails.amount,
        type: "salary_credit",
        status: "failed",
        description: "Salary Transfer Failed",
        reference: `failed_transfer_${Date.now()}`,
        metadata: {
          error: error.message,
          ...transferDetails.metadata,
        },
      });

      await failedTransaction.save();

      throw error;
    }
  }

  static async getWalletDetails(companyId) {
    try {
      // Find the company wallet
      const wallet = await Wallet.findOne({ company: companyId });

      if (!wallet) {
        return null;
      }

      // If wallet exists but hasn't been synced, sync it
      if (!wallet.wallet.accountNumber) {
        await this.syncWalletBalance(companyId);
        
        // Reload the wallet after sync
        return await Wallet.findOne({ company: companyId });
      }

      return wallet;
    } catch (error) {
      console.error(`Error getting wallet details for company ${companyId}:`, error);
      return null;
    }
  }
}

module.exports = WalletService;

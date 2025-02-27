const WalletService = require("../../services/walletService");
const Company = require("../../models/company.model");
const Wallet = require("../../models/wallet.model");
const Transaction = require("../../models/transaction.model");
const emailService = require("../../utils/email");

exports.createCompanyWallet = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Verify company exists and user has permission
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Create wallet
    const wallet = await WalletService.createWalletForCompany(companyId);

    res.status(201).json({
      message: "Wallet created successfully",
      wallet,
    });
  } catch (error) {
    console.error("Wallet Creation Error:", error);
    res.status(500).json({
      message: "Failed to create wallet",
      error: error.message,
    });
  }
};

exports.getWalletBalance = async (req, res) => {
  try {
    const companyId = req.user.company;
    const wallet = await Wallet.findOne({ company: companyId });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Check if balance is below threshold (e.g., if less than next payroll amount)
    const nextPayroll = await Transaction.findOne({
      company: companyId,
      type: 'payroll',
      status: 'pending'
    }).sort({ createdAt: -1 });

    if (nextPayroll && wallet.wallet.availableBalance < nextPayroll.amount) {
      // Send low balance alert
      await emailService.sendLowBalanceAlert({
        adminEmail: req.user.email,
        currentBalance: wallet.wallet.availableBalance,
        upcomingPayroll: nextPayroll.amount,
        walletUrl: `${process.env.FRONTEND_URL}/wallet`
      });
    }

    res.status(200).json(wallet);
  } catch (error) {
    console.error("Error getting wallet balance:", error);
    res.status(500).json({
      message: "Error retrieving wallet balance",
      error: error.message,
    });
  }
};

exports.transferFunds = async (req, res) => {
  try {
    const { fromCompanyId, toCompanyId, amount } = req.body;

    // Transfer funds
    const result = await WalletService.transferFunds(
      fromCompanyId,
      toCompanyId,
      amount
    );

    // Send transfer notification
    await emailService.sendEmail({
      to: req.user.email,
      subject: "Funds Transfer Successful",
      text: `Funds have been transferred from ${fromCompanyId} to ${toCompanyId}. Amount: ${amount}`,
      html: `
        <div class="email-container">
          <h2>Funds Transfer Successful</h2>
          <p>Hello ${req.user.firstName},</p>
          <p>Funds have been successfully transferred.</p>
          <p><strong>From:</strong> ${fromCompanyId}</p>
          <p><strong>To:</strong> ${toCompanyId}</p>
          <p><strong>Amount:</strong> ${amount}</p>
          <p><strong>Transaction Date:</strong> ${new Date().toLocaleString()}</p>
          <a href="${process.env.FRONTEND_URL}/wallet" class="button">View Wallet</a>
        </div>
      `
    });

    res.status(200).json({
      message: "Funds transfer successful",
      result,
    });
  } catch (error) {
    console.error("Funds Transfer Error:", error);
    res.status(500).json({
      message: "Failed to transfer funds",
      error: error.message,
    });
  }
};

exports.syncWalletBalance = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Sync wallet balance
    const wallet = await WalletService.syncWalletBalance(companyId);

    res.status(200).json({
      message: 'Wallet balance synced',
      wallet
    });
  } catch (error) {
    console.error('Wallet Sync Error:', error);
    res.status(500).json({
      message: 'Failed to sync wallet balance',
      error: error.message
    });
  }
};

// Credit wallet
exports.creditWallet = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { amount, metadata } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: 'Invalid amount. Amount must be a positive number.'
      });
    }

    // Credit wallet
    const result = await WalletService.creditWallet(companyId, amount, metadata);

    // Send credit notification
    await emailService.sendEmail({
      to: req.user.email,
      subject: "Wallet Credited",
      text: `Your wallet has been credited with ${amount}. New balance: ${result.wallet.availableBalance}`,
      html: `
        <div class="email-container">
          <h2>Wallet Credited</h2>
          <p>Hello ${req.user.firstName},</p>
          <p>Your wallet has been successfully credited.</p>
          <p><strong>Amount:</strong> ${amount}</p>
          <p><strong>New Balance:</strong> ${result.wallet.availableBalance}</p>
          <p><strong>Transaction Date:</strong> ${new Date().toLocaleString()}</p>
          <a href="${process.env.FRONTEND_URL}/wallet" class="button">View Wallet</a>
        </div>
      `
    });

    res.status(200).json({
      message: 'Wallet credited successfully',
      result
    });
  } catch (error) {
    console.error('Wallet Credit Error:', error);
    res.status(500).json({
      message: 'Failed to credit wallet',
      error: error.message
    });
  }
};

// Debit wallet
exports.debitWallet = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { amount, metadata } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: 'Invalid amount. Amount must be a positive number.'
      });
    }

    // Debit wallet
    const result = await WalletService.debitWallet(companyId, amount, metadata);

    // Send debit notification
    await emailService.sendEmail({
      to: req.user.email,
      subject: "Wallet Debited",
      text: `Your wallet has been debited with ${amount}. New balance: ${result.wallet.availableBalance}`,
      html: `
        <div class="email-container">
          <h2>Wallet Debited</h2>
          <p>Hello ${req.user.firstName},</p>
          <p>Your wallet has been successfully debited.</p>
          <p><strong>Amount:</strong> ${amount}</p>
          <p><strong>New Balance:</strong> ${result.wallet.availableBalance}</p>
          <p><strong>Transaction Date:</strong> ${new Date().toLocaleString()}</p>
          <a href="${process.env.FRONTEND_URL}/wallet" class="button">View Wallet</a>
        </div>
      `
    });

    res.status(200).json({
      message: 'Wallet debited successfully',
      result
    });
  } catch (error) {
    console.error('Wallet Debit Error:', error);
    res.status(500).json({
      message: 'Failed to debit wallet',
      error: error.message
    });
  }
};

exports.getWalletAccountNumber = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Get wallet details
    const wallet = await WalletService.getWalletDetails(companyId);

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.status(200).json({
      message: "Wallet account number retrieved",
      accountNumber: wallet.wallet.accountNumber,
      accountName: wallet.wallet.accountName,
      bankName: wallet.wallet.bankName
    });
  } catch (error) {
    console.error("Wallet Account Number Error:", error);
    res.status(500).json({
      message: "Failed to retrieve wallet account number",
      error: error.message,
    });
  }
};

// Handle failed transactions
exports.handleFailedTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId).populate('company');
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Send failed transaction notification
    await emailService.sendEmail({
      to: req.user.email,
      subject: "Transaction Failed",
      text: `Transaction ${transactionId} has failed. Please check your wallet dashboard for details.`,
      html: `
        <div class="email-container">
          <h2>⚠️ Transaction Failed</h2>
          <p>Hello ${req.user.firstName},</p>
          <p>We encountered an issue with your transaction.</p>
          <p><strong>Transaction ID:</strong> ${transactionId}</p>
          <p><strong>Amount:</strong> ${transaction.amount}</p>
          <p><strong>Date:</strong> ${transaction.createdAt.toLocaleString()}</p>
          <p>Please check your wallet dashboard for more details and try again.</p>
          <a href="${process.env.FRONTEND_URL}/wallet/transactions" class="button">View Transaction</a>
        </div>
      `
    });

    res.status(200).json({
      message: "Failed transaction notification sent",
      transaction
    });
  } catch (error) {
    console.error("Error handling failed transaction:", error);
    res.status(500).json({
      message: "Error handling failed transaction",
      error: error.message,
    });
  }
};

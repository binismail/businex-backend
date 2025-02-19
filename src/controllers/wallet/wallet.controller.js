const WalletService = require("../../services/walletService");
const Company = require("../../models/company.model");

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
    const { companyId } = req.params;

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Get wallet balance
    const balance = await WalletService.getWalletBalance(companyId);

    res.status(200).json({
      message: "Wallet balance retrieved",
      balance,
    });
  } catch (error) {
    console.error("Wallet Balance Error:", error);
    res.status(500).json({
      message: "Failed to retrieve wallet balance",
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

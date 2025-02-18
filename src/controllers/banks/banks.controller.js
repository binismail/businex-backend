const axios = require("axios");

// const serverUrl = process.env.XPRESS_SERVER_URL;

// Get banks list from Xpress Wallet
exports.getBanks = async (req, res) => {
  try {
    // Fetch banks
    const serverUrl = `https://payment.xpress-wallet.com/api/v1/transfer/banks`;
    const response = await axios.get(serverUrl, {
      headers: {
        Authorization: `Bearer ${process.env.XPRESS_ACCESS_TOKEN}`,
      },
    });

    res.status(200).json({
      message: "Banks retrieved successfully",
      banks: response.data.banks,
    });
  } catch (error) {
    console.error(
      "Get Banks Error:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      message: "Error fetching banks",
      error: error.message,
    });
  }
};

// Verify bank account
exports.verifyBankAccount = async (req, res) => {
  try {
    const { account_number, bank_code } = req.body;

    // Validate input
    if (!account_number || !bank_code) {
      return res.status(400).json({
        message: "Account number and bank code are required",
      });
    }

    // Verify account
    const serverUrl = `https://payment.xpress-wallet.com/api/v1/transfer/account/details`;
    const response = await axios.get(serverUrl, {
      params: {
        sortCode: bank_code,
        accountNumber: account_number,
      },
      headers: {
        Authorization: `Bearer ${process.env.XPRESS_ACCESS_TOKEN}`,
      },
    });

    // Check if account verification was successful
    if (!response.data.status) {
      return res.status(404).json({
        message: "Account verification failed",
        details: response.data,
      });
    }

    // Transform response
    const verifiedAccount = {
      accountName: response.data.account.accountName,
      accountNumber: response.data.account.accountNumber,
      bankCode: response.data.account.bankCode,
      bankName: null, // You might want to match this with your bank list
    };

    res.status(200).json({
      message: "Account verified successfully",
      data: verifiedAccount,
    });
  } catch (error) {
    console.error(
      "Verify Account Error:",
      error.response ? error.response.data : error.message
    );
    res.status(400).json({
      message: "Could not verify account",
      error: error.message,
      details: error.response ? error.response.data : null,
    });
  }
};

// Optional: Refresh token method
exports.refreshXpressWalletToken = async (req, res) => {
  try {
    const { refreshToken } = await authenticateXpressWallet();

    res.status(200).json({
      message: "Token refreshed successfully",
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error refreshing token",
      error: error.message,
    });
  }
};

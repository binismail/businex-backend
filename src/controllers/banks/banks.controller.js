const axios = require('axios');

// Nigerian banks list (dummy data)
const BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Zenith Bank", code: "057" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "United Bank for Africa", code: "033" },
  { name: "Guaranty Trust Bank", code: "058" },
  { name: "Union Bank", code: "032" },
  { name: "Fidelity Bank", code: "070" },
  { name: "Ecobank", code: "050" },
  { name: "Sterling Bank", code: "232" },
  { name: "Unity Bank", code: "215" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered", code: "068" },
  { name: "Wema Bank", code: "035" },
  { name: "Citibank", code: "023" },
  { name: "Polaris Bank", code: "076" }
];

// Get banks list
exports.getBanks = async (req, res) => {
  try {
    res.status(200).json({
      message: "Banks retrieved successfully",
      banks: BANKS
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching banks",
      error: error.message
    });
  }
};

// Verify bank account (dummy verification)
exports.verifyBankAccount = async (req, res) => {
  try {
    const { account_number, bank_code } = req.body;

    if (!account_number || !bank_code) {
      return res.status(400).json({
        message: "Account number and bank code are required"
      });
    }

    // Find bank name from code
    const bank = BANKS.find(b => b.code === bank_code);
    if (!bank) {
      return res.status(400).json({
        message: "Invalid bank code"
      });
    }

    // Dummy verification - just returns a formatted name
    const accountName = `TEST ACCOUNT ${account_number.slice(-4)}`;

    res.status(200).json({
      message: "Account verified successfully",
      data: {
        accountName,
        accountNumber: account_number,
        bankCode: bank_code,
        bankName: bank.name
      }
    });
  } catch (error) {
    res.status(400).json({
      message: "Could not verify account",
      error: error.message
    });
  }
};

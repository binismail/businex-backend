const mongoose = require("mongoose");
const WalletService = require("../src/services/walletService");
const Company = require("../src/models/company.model");
require("dotenv").config(); // Load environment variables

const MONGO_URI = process.env.MONGO_URI.replace(
  "<PASSWORD>",
  process.env.MONGO_PASSWORD
);

async function fundCompanyWallet(companyNameOrId, amount) {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Find company by name or ID
    let company;
    if (mongoose.Types.ObjectId.isValid(companyNameOrId)) {
      company = await Company.findById(companyNameOrId);
    } else {
      company = await Company.findOne({ name: companyNameOrId });
    }

    if (!company) {
      throw new Error(`Company not found: ${companyNameOrId}`);
    }

    // Ensure company has a wallet
    if (!company.wallet) {
      console.log(`Creating wallet for ${company.name}`);
      await WalletService.createWalletForCompany(company._id);
      
      // Refresh company data
      company = await Company.findById(company._id);
    }

    // Credit the wallet
    console.log(`Funding wallet for ${company.name} with ₦${amount}`);
    const creditResult = await WalletService.creditWallet(
      company._id, 
      amount, 
      { 
        description: `Initial wallet funding`, 
        source: 'manual_seeding' 
      }
    );

    console.log('Credit Transaction Details:', {
      success: creditResult.success,
      message: creditResult.message,
      reference: creditResult.reference
    });

    // Optional: Debit a small amount to test
    console.log(`Testing wallet debit for ${company.name}`);
    const debitResult = await WalletService.debitWallet(
      company._id, 
      100, 
      { 
        description: 'Wallet functionality test', 
        source: 'manual_seeding' 
      }
    );

    console.log('Debit Transaction Details:', {
      success: debitResult.success,
      message: debitResult.message,
      reference: debitResult.reference
    });

    // Close MongoDB connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Wallet Funding Error:', error);
    mongoose.connection.close();
  }
}

// Allow running the script directly or importing the function
if (require.main === module) {
  const companyNameOrId = process.argv[2];
  const amount = parseFloat(process.argv[3]);

  if (!companyNameOrId || !amount) {
    console.error('Usage: node fundCompanyWallet.js "Company Name" 50000');
    process.exit(1);
  }

  fundCompanyWallet(companyNameOrId, amount);
}

module.exports = fundCompanyWallet;

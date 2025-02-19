const mongoose = require("mongoose");
const WalletService = require("../src/services/walletService");
const Company = require("../src/models/company.model");
require("dotenv").config(); // Load environment variables

const MONGO_URI = process.env.MONGO_URI.replace(
  "<PASSWORD>",
  process.env.MONGO_PASSWORD
);

async function seedWallets() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Find companies without wallets
    const companiesWithoutWallets = await Company.find({
      wallet: { $exists: false },
    });

    console.log(
      `Found ${companiesWithoutWallets.length} companies without wallets`
    );

    // Create wallets for each company
    for (const company of companiesWithoutWallets) {
      try {
        const wallet = await WalletService.createWalletForCompany(company._id);
        console.log(`Wallet created for company: ${company.name}`);
      } catch (walletError) {
        console.error(
          `Failed to create wallet for ${company.name}:`,
          walletError.message
        );
      }
    }

    console.log("Wallet seeding completed");
    mongoose.connection.close();
  } catch (error) {
    console.error("Seeding Error:", error);
    mongoose.connection.close();
  }
}

// Run the seeder
seedWallets();

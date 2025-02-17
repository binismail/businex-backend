const mongoose = require("mongoose");
const seedCompany = require("./companySeeder");
const seedEmployees = require("./employeeSeeder");
const seedDepartments = require("./departmentSeeder");
const seedPayrolls = require("./payrollSeeder");
const seedDeductionsAndExtraEarnings = require("./deductionExtraEarningSeeder");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI.replace(
  "<PASSWORD>",
  process.env.MONGO_PASSWORD
);

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Run seeders in sequence
    // await seedCompany();
    // await seedDepartments(); // Seed departments after companies
    // await seedEmployees();
    //await seedDeductionsAndExtraEarnings(); // Seed deductions and extra earnings
    await seedPayrolls(); // Seed payrolls after all other data

    console.log("Database seeding completed");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  }
};

// Run seeders if this file is run directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

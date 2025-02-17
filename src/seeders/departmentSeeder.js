const Department = require("../models/department.model");
const Company = require("../models/company.model");
const { DEFAULT_DEPARTMENTS } = require("../utils/defaultDepartments");
const mongoose = require("mongoose");

const seedDepartments = async () => {
  try {
    // Get all companies
    const companies = await Company.find({});

    for (const company of companies) {
      const departments = DEFAULT_DEPARTMENTS.map(dept => ({
        ...dept,
        company: company._id
      }));

      // Try to create departments for each company
      try {
        await Department.insertMany(departments, { ordered: false });
        console.log(`Seeded departments for company: ${company.name}`);
      } catch (error) {
        // If error is duplicate key, some departments were created, which is fine
        if (error.code !== 11000) {
          console.error(`Error seeding departments for company ${company.name}:`, error);
        }
      }
    }

    console.log("Department seeding completed");
  } catch (error) {
    console.error("Error in department seeder:", error);
  }
};

module.exports = seedDepartments;

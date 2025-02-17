const Deduction = require("../models/deduction.model");
const ExtraEarning = require("../models/extraEarning.model");
const Employee = require("../models/employees.model");
const Department = require("../models/department.model");
const Company = require("../models/company.model");

const defaultDeductions = [
  {
    name: "Late Arrival Fee",
    description: "Deduction for arriving late to work",
    amount: 1000,
    type: "fixed",
    frequency: "one-time"
  },
  {
    name: "Equipment Damage",
    description: "Deduction for damaged company equipment",
    amount: 5000,
    type: "fixed",
    frequency: "one-time"
  },
  {
    name: "Training Cost",
    description: "Monthly training cost deduction",
    amount: 2000,
    type: "fixed",
    frequency: "recurring"
  },
  {
    name: "Loan Repayment",
    description: "Monthly loan repayment",
    amount: 10000,
    type: "fixed",
    frequency: "recurring"
  }
];

const defaultExtraEarnings = [
  {
    name: "Overtime Pay",
    description: "Additional pay for overtime work",
    amount: 15,
    type: "percentage",
    frequency: "recurring"
  },
  {
    name: "Performance Bonus",
    description: "Bonus for exceptional performance",
    amount: 50000,
    type: "fixed",
    frequency: "one-time"
  },
  {
    name: "Night Shift Allowance",
    description: "Additional pay for night shift work",
    amount: 5000,
    type: "fixed",
    frequency: "recurring"
  },
  {
    name: "Project Completion Bonus",
    description: "Bonus for completing projects on time",
    amount: 25000,
    type: "fixed",
    frequency: "one-time"
  }
];

const seedDeductionsAndExtraEarnings = async () => {
  try {
    // Get all companies
    const companies = await Company.find({});

    for (const company of companies) {
      // Get departments and employees for this company
      const departments = await Department.find({ company: company._id });
      const employees = await Employee.find({ company: company._id });

      // Seed deductions
      for (const deduction of defaultDeductions) {
        const newDeduction = new Deduction({
          ...deduction,
          company: company._id
        });

        // Randomly apply to either departments or employees
        if (Math.random() > 0.5 && departments.length > 0) {
          // Apply to a random department
          const randomDept = departments[Math.floor(Math.random() * departments.length)];
          newDeduction.applications.push({
            target_type: "department",
            target_id: randomDept._id,
            start_date: new Date(),
            end_date: deduction.frequency === "one-time" ? new Date(Date.now() + 30*24*60*60*1000) : null
          });
        } else if (employees.length > 0) {
          // Apply to random employees (1-3)
          const numEmployees = Math.floor(Math.random() * 3) + 1;
          const selectedEmployees = [...employees]
            .sort(() => 0.5 - Math.random())
            .slice(0, numEmployees);

          selectedEmployees.forEach(employee => {
            newDeduction.applications.push({
              target_type: "employee",
              target_id: employee._id,
              start_date: new Date(),
              end_date: deduction.frequency === "one-time" ? new Date(Date.now() + 30*24*60*60*1000) : null
            });
          });
        }

        await newDeduction.save();
      }

      // Seed extra earnings
      for (const earning of defaultExtraEarnings) {
        const newEarning = new ExtraEarning({
          ...earning,
          company: company._id
        });

        // Randomly apply to either departments or employees
        if (Math.random() > 0.5 && departments.length > 0) {
          // Apply to a random department
          const randomDept = departments[Math.floor(Math.random() * departments.length)];
          newEarning.applications.push({
            target_type: "department",
            target_id: randomDept._id,
            start_date: new Date(),
            end_date: earning.frequency === "one-time" ? new Date(Date.now() + 30*24*60*60*1000) : null
          });
        } else if (employees.length > 0) {
          // Apply to random employees (1-3)
          const numEmployees = Math.floor(Math.random() * 3) + 1;
          const selectedEmployees = [...employees]
            .sort(() => 0.5 - Math.random())
            .slice(0, numEmployees);

          selectedEmployees.forEach(employee => {
            newEarning.applications.push({
              target_type: "employee",
              target_id: employee._id,
              start_date: new Date(),
              end_date: earning.frequency === "one-time" ? new Date(Date.now() + 30*24*60*60*1000) : null
            });
          });
        }

        await newEarning.save();
      }

      console.log(`Seeded deductions and extra earnings for company: ${company.name}`);
    }

    console.log("Deductions and extra earnings seeding completed");
  } catch (error) {
    console.error("Error seeding deductions and extra earnings:", error);
  }
};

module.exports = seedDeductionsAndExtraEarnings;

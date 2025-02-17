const cron = require("node-cron");
const PayrollController = require("../controllers/payrollController");
const Company = require("../models/company.model");
const Payroll = require("../models/payroll.model");
const { processPayroll } = require("../controllers/payroll/payroll.controller");

// This runs at midnight on the 1st of every month
cron.schedule("0 0 1 * *", async () => {
  console.log("Running monthly payroll processing...");

  try {
    // Fetch all companies to process payroll for
    const companies = await Company.find(); // Fetch all companies

    for (const company of companies) {
      const employees = company.employees; // Assuming each company has employees associated

      // Build the payroll data for each company
      const payrolls = await Promise.all(
        employees.map(async (employee) => {
          // Fetch payroll details for each employee
          const payrollData = await Payroll.findOne({
            employee: employee._id,
            status: "pending",
          });

          if (!payrollData) return null; // Skip if no pending payroll data

          return {
            employeeId: employee._id,
            salary: payrollData.salary,
            deductions: payrollData.deductions,
            bonuses: payrollData.bonuses,
            netSalary: payrollData.net_salary,
          };
        })
      );

      // Filter out any null (employees without pending payroll)
      const filteredPayrolls = payrolls.filter((p) => p !== null);

      // If no payrolls to process, skip this company
      if (filteredPayrolls.length === 0) {
        continue;
      }

      // Pass data to payroll processing
      await processPayroll({
        companyId: company._id, // Pass company ID
        payrolls: filteredPayrolls, // Pass payroll data
      });

      console.log(`Payroll processed for company: ${company.name}`);
    }

    console.log("Monthly payroll processing completed.");
  } catch (error) {
    console.error("Error processing monthly payroll:", error);
  }
});

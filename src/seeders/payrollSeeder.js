const Payroll = require("../models/payroll.model");
const Employee = require("../models/employees.model");
const Company = require("../models/company.model");
const { calculateTax } = require("../utils/taxCalculator");

const generatePayrollName = (date, frequency) => {
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();
  return `${month} ${year} ${
    frequency.charAt(0).toUpperCase() + frequency.slice(1)
  } Payroll`;
};

const generatePayslips = async (employees) => {
  return employees
    .map((employee) => {
      try {
        // Ensure we have a valid salary
        const baseSalary = Number(employee.salary) || 150000; // Default to 150,000 if no salary
        
        // Calculate allowances (30% of base salary)
        const allowances = [
          {
            type: "transport",
            amount: Math.round(baseSalary * 0.15), // 15% transport allowance
            description: "Transport Allowance",
          },
          {
            type: "housing",
            amount: Math.round(baseSalary * 0.15), // 15% housing allowance
            description: "Housing Allowance",
          },
        ];

        // Calculate gross pay (base + allowances)
        const totalAllowances = allowances.reduce(
          (sum, a) => sum + a.amount,
          0
        );
        const grossPay = baseSalary + totalAllowances;

        // Calculate deductions
        const tax = calculateTax(grossPay).monthlyTax;
        const pension = Math.round(baseSalary * 0.08); // 8% pension contribution

        const deductions = [
          {
            type: "tax",
            amount: Math.round(tax),
            description: "PAYE Tax",
          },
          {
            type: "pension",
            amount: pension,
            description: "Pension Contribution",
          },
        ];

        const totalDeductions = deductions.reduce(
          (sum, d) => sum + d.amount,
          0
        );

        // Calculate net pay
        const netPay = grossPay - totalDeductions;

        // Log the calculations for debugging
        console.log(`
          Employee: ${employee.name}
          Base Salary: ${baseSalary}
          Allowances: ${totalAllowances}
          Gross Pay: ${grossPay}
          Deductions: ${totalDeductions}
          Net Pay: ${netPay}
        `);

        return {
          employee: employee._id,
          base_salary: baseSalary,
          allowances,
          deductions,
          gross_pay: grossPay,
          net_pay: netPay,
          status: "completed",
        };
      } catch (error) {
        console.error(
          `Error generating payslip for employee ${employee._id || 'unknown'}:`,
          error
        );
        return null;
      }
    })
    .filter((payslip) => payslip !== null); // Remove any failed payslips
};

const seedPayrolls = async () => {
  try {
    // Get all companies
    const companies = await Company.find({});
    console.log(`Found ${companies.length} companies`);

    for (const company of companies) {
      // Get all active employees for the company
      const employees = await Employee.find({
        company: company._id,
        status: "present",
      });

      console.log(
        `Found ${employees.length} employees for company ${company.name}`
      );

      if (employees.length === 0) {
        console.log(`Skipping company ${company.name} - no active employees`);
        continue;
      }

      // Generate payrolls for the last 6 months
      const currentDate = new Date();
      const frequencies = ["monthly", "bi-weekly"];
      const statuses = ["draft", "pending", "processing", "completed"];

      for (let i = 0; i < 6; i++) {
        for (const frequency of frequencies) {
          const startDate = new Date(currentDate);
          startDate.setMonth(startDate.getMonth() - i);
          startDate.setDate(1); // Start of month

          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 1);
          endDate.setDate(0); // End of month

          try {
            const payslips = await generatePayslips(employees);

            // Calculate totals
            const summary = payslips.reduce(
              (acc, slip) => ({
                total_gross: acc.total_gross + slip.gross_pay,
                total_deductions:
                  acc.total_deductions +
                  slip.deductions.reduce((sum, d) => sum + d.amount, 0),
                total_allowances:
                  acc.total_allowances +
                  slip.allowances.reduce((sum, a) => sum + a.amount, 0),
                total_net: acc.total_net + slip.net_pay,
              }),
              {
                total_gross: 0,
                total_deductions: 0,
                total_allowances: 0,
                total_net: 0,
              }
            );

            // Randomly select a status
            const statusIndex =
              i === 0
                ? Math.floor(Math.random() * 3) // More recent payrolls
                : Math.floor(Math.random() * statuses.length); // Older payrolls

            const payroll = new Payroll({
              company: company._id,
              name: generatePayrollName(startDate, frequency),
              period: {
                start_date: startDate,
                end_date: endDate,
              },
              frequency,
              status: statuses[statusIndex],
              total_employees: employees.length,
              payslips,
              summary,
              schedule: {
                next_run:
                  i === 0
                    ? new Date(currentDate.setMonth(currentDate.getMonth() + 1))
                    : null,
                last_run: i === 0 ? null : endDate,
                is_recurring: i === 0, // Only make current month recurring
              },
            });

            await payroll.save();
            console.log(
              `Created ${frequency} payroll for ${company.name} - ${
                startDate.toISOString().split("T")[0]
              }`
            );
          } catch (error) {
            console.error(`Error creating payroll for ${company.name}:`, error);
          }
        }
      }
    }

    console.log("Payroll seeding completed");
  } catch (error) {
    console.error("Error seeding payrolls:", error);
    throw error; // Re-throw to see the error in the main seeder
  }
};

module.exports = seedPayrolls;

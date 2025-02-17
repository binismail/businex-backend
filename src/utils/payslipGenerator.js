exports.generatePayslip = async (payroll, employee) => {
  // Example of a simple payslip object stored in the database
  const payslipData = {
    employeeName: employee.name,
    salary: payroll.salary,
    deductions: payroll.deductions,
    bonuses: payroll.bonuses,
    netSalary: payroll.netSalary,
    date: new Date(),
  };

  // You could return a PDF path or just return this object to store it in the database
  return payslipData;
};

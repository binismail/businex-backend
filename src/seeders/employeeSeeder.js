const mongoose = require("mongoose");
const Employee = require("../models/employees.model");
const Company = require("../models/company.model");

const generateFakeEmployees = (companyId, count = 10) => {
  const departments = ["Engineering", "Sales", "Marketing", "HR", "Finance"];
  const positions = ["Manager", "Senior", "Junior", "Lead", "Associate"];
  const statuses = ["present", "inactive", "absent"];

  return Array.from({ length: count }, (_, index) => ({
    name: `Employee ${index + 1}`,
    email: `employee${index + 1}@example.com`,
    phone: `+234${Math.floor(Math.random() * 1000000000)}`,
    position: positions[Math.floor(Math.random() * positions.length)],
    department: departments[Math.floor(Math.random() * departments.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    salary: Math.floor(Math.random() * 500000) + 50000,
    country: "Nigeria",
    currency: "NGN",
    company: companyId,
    tax_information: `TAX${Math.floor(Math.random() * 1000000)}`,
  }));
};

const seedEmployees = async () => {
  try {
    // Clear existing employees
    await Employee.deleteMany({});

    // Get the first company (you might want to modify this based on your needs)
    const company = await Company.findById("67ab185ea60b25b9fee4efa3");

    if (!company) {
      console.log("No company found. Please seed companies first.");
      return;
    }

    const fakeEmployees = generateFakeEmployees(company._id);
    await Employee.insertMany(fakeEmployees);

    console.log("Successfully seeded employees");
  } catch (error) {
    console.error("Error seeding employees:", error);
  }
};

module.exports = {
  seedEmployees,
};

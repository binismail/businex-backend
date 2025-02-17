const DEFAULT_DEPARTMENTS = [
  {
    name: "Human Resources",
    code: "HR",
    description:
      "Manages employee relations, recruitment, and personnel development",
  },
  {
    name: "Finance",
    code: "FIN",
    description: "Handles financial planning, accounting, and payroll",
  },
  {
    name: "Information Technology",
    code: "IT",
    description: "Manages technology infrastructure and software systems",
  },
  {
    name: "Operations",
    code: "OPS",
    description: "Oversees day-to-day business operations",
  },
  {
    name: "Sales",
    code: "SALES",
    description: "Manages revenue generation and client relationships",
  },
  {
    name: "Marketing",
    code: "MKT",
    description: "Handles brand management and marketing initiatives",
  },
  {
    name: "Administration",
    code: "ADMIN",
    description: "Manages office operations and administrative tasks",
  },
  {
    name: "Customer Service",
    code: "CS",
    description: "Handles customer support and satisfaction",
  },
  {
    name: "Legal",
    code: "LG",
    description: "Provides legal services to the company",
  },
  {
    name: "Engineering",
    code: "ENG",
    description: "Handles engineering activities",
  },
];

const seedDefaultDepartments = async (companyId, Department) => {
  try {
    const departments = DEFAULT_DEPARTMENTS.map((dept) => ({
      ...dept,
      company: companyId,
    }));

    // Use insertMany with ordered: false to continue if some departments already exist
    await Department.insertMany(departments, { ordered: false });

    return true;
  } catch (error) {
    // If error is duplicate key, some departments were created, which is fine
    if (error.code === 11000) {
      return true;
    }
    throw error;
  }
};

module.exports = {
  DEFAULT_DEPARTMENTS,
  seedDefaultDepartments,
};

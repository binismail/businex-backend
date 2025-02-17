const Employee = require("../../models/employees.model");

// Create a new employee
exports.createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      position,
      department,
      salary,
      tax_information,
      bankDetails,
    } = req.body;

    const newEmployee = new Employee({
      name,
      email,
      phone,
      position,
      department,
      company: req.user.company,
      salary,
      tax_information,
      bankDetails, // account details, bank, bank_code, number etc..
    });

    await newEmployee.save();

    res.status(201).json({
      message: "Employee created successfully",
      employee: newEmployee,
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating employee", error: error.message });
  }
};

// Create multiple employees
exports.createEmployees = async (req, res) => {
  try {
    const { employees } = req.body;
    const companyId = req.user.company;

    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({
        message: "Please provide an array of employees",
      });
    }

    // Validate all emails are unique
    const emails = employees.map((emp) => emp.email);
    const uniqueEmails = new Set(emails);
    if (emails.length !== uniqueEmails.size) {
      return res.status(400).json({
        message: "Duplicate email addresses found",
      });
    }

    // Check if any email already exists
    const existingEmails = await Employee.find({
      email: { $in: emails },
    }).select("email");

    if (existingEmails.length > 0) {
      return res.status(400).json({
        message: "Some email addresses already exist",
        emails: existingEmails.map((emp) => emp.email),
      });
    }

    // Prepare employee data
    const employeesData = employees.map((employee) => ({
      ...employee,
      company: companyId,
    }));

    // Create all employees
    const createdEmployees = await Employee.insertMany(employeesData, {
      ordered: false, // Continues inserting even if there are errors
    });

    res.status(201).json({
      message: `Successfully created ${createdEmployees.length} employees`,
      employees: createdEmployees,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating employees",
      error: error.message,
    });
  }
};

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      department,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const companyId = req.user.company;

    // Build query
    const query = { company: companyId };

    // Add filters if provided
    if (status) {
      query.status = status;
    }
    if (department) {
      query.department = department;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { position: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Get total count for pagination
    const totalEmployees = await Employee.find(query).countDocuments();

    // If no employees found, return early with empty array
    if (totalEmployees === 0) {
      return res.status(200).json({
        message: "No employees found",
        employees: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          pages: 0,
          limit: parseInt(limit),
        },
        filters: {
          departments: [],
          statuses: ["present", "inactive", "absent"],
        },
      });
    }

    // Get employees with pagination, sorting and populate necessary fields
    const employees = await Employee.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-__v")
      .populate("department", "name")
      .lean();

    // Get unique departments for filters
    const departments = await Employee.distinct("department", {
      company: companyId,
    });

    res.status(200).json({
      message: `Found ${totalEmployees} employee${
        totalEmployees === 1 ? "" : "s"
      }`,
      employees,
      pagination: {
        total: totalEmployees,
        page: parseInt(page),
        pages: Math.ceil(totalEmployees / parseInt(limit)),
        limit: parseInt(limit),
      },
      filters: {
        departments,
        statuses: ["present", "inactive", "absent"],
      },
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({
      message: "Error fetching employees",
      error: error.message,
    });
  }
};

// Get a single employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });
    res.status(200).json(employee);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching employee", error: error.message });
  }
};

// Update an employee
exports.updateEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      position,
      salary,
      tax_information,
      employment_end_date,
      payroll_status,
    } = req.body;
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        phone,
        position,
        salary,
        tax_information,
        employment_end_date,
        payroll_status,
      },
      { new: true } // Returns the updated employee
    );
    if (!updatedEmployee)
      return res.status(404).json({ message: "Employee not found" });
    res.status(200).json({
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating employee", error: error.message });
  }
};

// Delete an employee
exports.deleteEmployee = async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    if (!deletedEmployee)
      return res.status(404).json({ message: "Employee not found" });
    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting employee", error: error.message });
  }
};

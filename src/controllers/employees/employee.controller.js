const Employee = require("../../models/employees.model");
const User = require("../../models/user.model");
const emailService = require("../../utils/email");
const mongoose = require("mongoose");
const Payroll = require("../../models/payroll.model");
const Company = require("../../models/company.model");

// Create a new employee
exports.createEmployee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

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

    const companyId = req.user.company;
    const employeeData = {
      name,
      email,
      phone,
      position,
      department,
      company: companyId,
      salary,
      tax_information,
      bankDetails,
    };

    const newEmployee = new Employee(employeeData);
    await newEmployee.save();

    // Send welcome email to the employee
    await emailService.sendEmployeeWelcomeEmail({
      email: newEmployee.email,
      employeeName: newEmployee.name,
      companyName: req.user.companyName,
      setupUrl: `${process.env.FRONTEND_URL}/employee/setup/${newEmployee._id}`,
    });

    res.status(201).json({
      message: "Employee created successfully",
      employee: newEmployee,
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    await session.abortTransaction();
    res.status(500).json({
      message: "Error creating employee",
      error: error.message,
    });
  }
};

// Create multiple employees
exports.createEmployees = async (req, res) => {
  // Start a session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();

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
    })
      .select("email")
      .session(session);

    if (existingEmails.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Some email addresses already exist",
        emails: existingEmails.map((emp) => emp.email),
      });
    }

    const company = await Company.findById(companyId).session(session);
    if (!company) {
      await session.abortTransaction();
      return res.status(404).json({
        message: "Company not found",
      });
    }

    // Prepare employee data
    const employeesData = employees.map((employee) => ({
      ...employee,
      company: companyId,
    }));

    // Create all employees within the transaction
    const createdEmployees = await Employee.insertMany(employeesData, {
      session,
      ordered: true, // Change to true to stop on first error
    });

    try {
      // Send welcome emails to the employees
      await Promise.all(
        createdEmployees.map((employee) =>
          emailService.sendEmployeeWelcomeEmail({
            email: employee.email,
            employeeName: employee.name,
            companyName: company.name,
            setupUrl: `${process.env.FRONTEND_URL}/employee/setup/${employee._id}`,
          })
        )
      );
    } catch (emailError) {
      // If email sending fails, rollback the transaction
      await session.abortTransaction();
      throw new Error("Failed to send welcome emails: " + emailError.message);
    }

    // If everything succeeds, commit the transaction
    await session.commitTransaction();

    res.status(201).json({
      message: `Successfully created ${createdEmployees.length} employees`,
      employees: createdEmployees,
    });
  } catch (error) {
    // Rollback the transaction on any error
    await session.abortTransaction();

    console.error("Error creating employees:", error);
    res.status(500).json({
      message: "Error creating employees",
      error: error.message,
    });
  } finally {
    // End the session
    session.endSession();
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
      department,
      salary,
      status,
      bankDetails,
      country,
      currency,
      tax_information,
      employment_start_date,
      employment_end_date,
      payroll_status,
    } = req.body;

    // Validate required fields if they are being updated
    const requiredFields = [
      "name",
      "email",
      "phone",
      "position",
      "department",
      "salary",
    ];
    const missingFields = requiredFields.filter((field) => {
      return req.body.hasOwnProperty(field) && !req.body[field];
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required fields",
        fields: missingFields,
      });
    }

    // Validate email format if being updated
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // Validate payroll_status if being updated
    if (payroll_status && !["active", "inactive"].includes(payroll_status)) {
      return res.status(400).json({
        message:
          "Invalid payroll status. Must be either 'active' or 'inactive'",
      });
    }

    // Validate status if being updated
    if (status && !["present", "inactive", "absent"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be one of: present, inactive, absent",
      });
    }

    // Build update object with only provided fields
    const updateFields = {};
    Object.entries(req.body).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields[key] = value;
      }
    });

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      {
        new: true,
        runValidators: true, // Ensures mongoose validation runs on update
      }
    ).populate("company", "name"); // Populate company name for email notification

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Prepare changes for email notification
    const changes = {};
    Object.keys(updateFields).forEach((field) => {
      if (field !== "company") {
        // Exclude company field from notification
        changes[field] = updatedEmployee[field];
      }
    });

    // Send update notification email to the employee
    // await emailService.sendEmployeeUpdateNotification({
    //   email: updatedEmployee.email,
    //   employeeName: updatedEmployee.name,
    //   companyName: updatedEmployee.company.name,
    //   changes,
    // });

    res.status(200).json({
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    // Check for duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Email already exists",
        error: "Duplicate email address",
      });
    }
    res.status(400).json({
      message: "Error updating employee",
      error: error.message,
    });
  }
};

// Delete an employee
exports.deleteEmployee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const employeeId = req.params.id;
    const companyId = req.user.company;

    // Find the employee first to ensure they exist and belong to the company
    const employee = await Employee.findOne({
      _id: employeeId,
      company: companyId,
    }).session(session);

    if (!employee) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Employee not found" });
    }

    // Find all draft and pending payrolls that include this employee
    const affectedPayrolls = await Payroll.find({
      company: companyId,
      status: { $in: ["draft", "pending"] },
      "payslips.employee": employeeId,
    }).session(session);

    // Remove employee from each affected payroll and recalculate totals
    for (const payroll of affectedPayrolls) {
      // Find the payslip for this employee
      const payslipIndex = payroll.payslips.findIndex(
        (p) => p.employee.toString() === employeeId
      );

      if (payslipIndex !== -1) {
        // Remove the payslip
        payroll.payslips.splice(payslipIndex, 1);

        // Update total employees count
        payroll.total_employees = payroll.payslips.length;

        // Recalculate payroll summary
        const summary = payroll.payslips.reduce(
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

        // Update summary
        payroll.summary = summary;

        // Save changes
        await payroll.save({ session });
      }
    }

    // Delete the employee
    await Employee.findByIdAndDelete(employeeId).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Employee deleted successfully",
      details: {
        payrolls_updated: affectedPayrolls.length,
        payroll_ids: affectedPayrolls.map((p) => p._id),
      },
    });
  } catch (error) {
    console.error("Error deleting employee:", error);
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      message: "Error deleting employee",
      error: error.message,
    });
  }
};

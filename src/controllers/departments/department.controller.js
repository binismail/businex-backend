const Department = require("../../models/department.model");

// Create a new department
exports.createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const companyId = req.user.company;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({
        message: "Department name and code are required"
      });
    }

    // Check if department code already exists for this company
    const existingDepartment = await Department.findOne({
      code: code.toUpperCase(),
      company: companyId
    });

    if (existingDepartment) {
      return res.status(400).json({
        message: "Department code already exists"
      });
    }

    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      description,
      company: companyId
    });

    res.status(201).json({
      message: "Department created successfully",
      department
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating department",
      error: error.message
    });
  }
};

// Get all departments for a company
exports.getDepartments = async (req, res) => {
  try {
    const companyId = req.user.company;
    const { status } = req.query;

    const query = { company: companyId };
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const departments = await Department.find(query)
      .select('name code description status')
      .sort({ name: 1 });

    res.status(200).json({
      message: "Departments retrieved successfully",
      departments
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching departments",
      error: error.message
    });
  }
};

// Update department
exports.updateDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { name, description, status } = req.body;
    const companyId = req.user.company;

    const department = await Department.findOne({
      _id: departmentId,
      company: companyId
    });

    if (!department) {
      return res.status(404).json({
        message: "Department not found"
      });
    }

    // Update fields
    if (name) department.name = name;
    if (description) department.description = description;
    if (status) department.status = status;

    await department.save();

    res.status(200).json({
      message: "Department updated successfully",
      department
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating department",
      error: error.message
    });
  }
};

// Delete department
exports.deleteDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const companyId = req.user.company;

    const department = await Department.findOne({
      _id: departmentId,
      company: companyId
    });

    if (!department) {
      return res.status(404).json({
        message: "Department not found"
      });
    }

    // Instead of deleting, mark as inactive
    department.status = "inactive";
    await department.save();

    res.status(200).json({
      message: "Department deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting department",
      error: error.message
    });
  }
};

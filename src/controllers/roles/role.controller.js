const mongoose = require('mongoose');
const Role = require("../../models/role.model");
const Department = require("../../models/department.model");
const { ObjectId } = mongoose.Types;

// Create a new role
exports.createRole = async (req, res) => {
  try {
    const {
      name,
      description,
      department,
      permissions,
      level,
      reportingTo
    } = req.body;
    const companyId = req.user.company.toString(); // Convert to string first

    // Case-insensitive check for existing role name
    const existingRole = await Role.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      company: new ObjectId(companyId)
    });

    if (existingRole) {
      return res.status(400).json({
        message: "Role with this name already exists in your company (case-insensitive)",
      });
    }

    // Validate department if provided
    if (department) {
      const dept = await Department.findOne({
        _id: new ObjectId(department),
        company: new ObjectId(companyId),
      });
      if (!dept) {
        return res.status(404).json({
          message: "Department not found or doesn't belong to your company",
        });
      }
    }

    // Create role object with basic fields
    const roleData = {
      name: name.trim(),
      description: description?.trim(),
      department: department ? new ObjectId(department) : undefined,
      permissions,
      level: level || 1,
      company: new ObjectId(companyId),
    };

    // Validate and add reportingTo if provided
    if (reportingTo) {
      console.log("Validating reportingTo:", reportingTo);
      
      const reportingRole = await Role.findOne({
        _id: new ObjectId(reportingTo),
        company: new ObjectId(companyId),
      });

      if (!reportingRole) {
        return res.status(404).json({
          message: "Reporting role not found or doesn't belong to your company",
        });
      }

      roleData.reportingTo = {
        id: reportingRole._id,
        name: reportingRole.name
      };
    }

    const role = new Role(roleData);
    await role.save();

    // Fetch the complete role with populated fields
    const savedRole = await Role.findById(role._id)
      .populate('department', 'name')
      .populate('reportingTo.id', 'name level');

    res.status(201).json({
      message: "Role created successfully",
      data: savedRole,
    });
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({
      message: "Error creating role",
      error: error.message,
    });
  }
};

// Get all roles with filtering and pagination
exports.getRoles = async (req, res) => {
  try {
    const companyId = req.user.company.toString();
    const {
      department,
      status,
      search,
      page = 1,
      limit = 10,
      sort = "level",
      order = "asc"
    } = req.query;

    // Build query
    const query = { company: new ObjectId(companyId) };
    
    // Add filters
    if (department) {
      query.department = new ObjectId(department);
    }
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === "asc" ? 1 : -1;

    const roles = await Role.find(query)
      .populate('department', 'name')
      .populate('reportingTo.id', 'name level')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Role.countDocuments(query);

    res.status(200).json({
      data: roles,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({
      message: "Error fetching roles",
      error: error.message,
    });
  }
};

// Get role by ID
exports.getRoleById = async (req, res) => {
  try {
    const { roleId } = req.params;
    const companyId = req.user.company.toString();

    const role = await Role.findOne({
      _id: new ObjectId(roleId),
      company: new ObjectId(companyId),
    })
      .populate('department', 'name')
      .populate('reportingTo.id', 'name level');

    if (!role) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    res.status(200).json({
      data: role,
    });
  } catch (error) {
    console.error("Error fetching role:", error);
    res.status(500).json({
      message: "Error fetching role",
      error: error.message,
    });
  }
};

// Update role
exports.updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const companyId = req.user.company.toString();
    const updates = req.body;

    // Check if role exists and belongs to company
    const role = await Role.findOne({
      _id: new ObjectId(roleId),
      company: new ObjectId(companyId),
    });

    if (!role) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    // Validate department if being updated
    if (updates.department) {
      const dept = await Department.findOne({
        _id: new ObjectId(updates.department),
        company: new ObjectId(companyId),
      });
      if (!dept) {
        return res.status(404).json({
          message: "Department not found or doesn't belong to your company",
        });
      }
    }

    // Validate reporting role if being updated
    if (updates.reportingTo) {
      const reportingRole = await Role.findOne({
        _id: new ObjectId(updates.reportingTo),
        company: new ObjectId(companyId),
      });
      if (!reportingRole) {
        return res.status(404).json({
          message: "Reporting role not found or doesn't belong to your company",
        });
      }
      
      role.reportingTo = {
        id: reportingRole._id,
        name: reportingRole.name
      };
    }

    // Update other fields
    if (updates.name) role.name = updates.name;
    if (updates.description) role.description = updates.description;
    if (updates.department) role.department = new ObjectId(updates.department);
    if (updates.permissions) role.permissions = updates.permissions;
    if (updates.level) role.level = updates.level;
    if (updates.status) role.status = updates.status;

    await role.save();

    // Fetch updated role with populated fields
    const updatedRole = await Role.findById(role._id)
      .populate('department', 'name')
      .populate('reportingTo.id', 'name level');

    res.status(200).json({
      message: "Role updated successfully",
      data: updatedRole,
    });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({
      message: "Error updating role",
      error: error.message,
    });
  }
};

// Delete role
exports.deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const companyId = req.user.company.toString();

    // Check if role exists and belongs to company
    const role = await Role.findOne({
      _id: new ObjectId(roleId),
      company: new ObjectId(companyId),
    });

    if (!role) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    // Check if any roles are reporting to this role
    const hasReportingRoles = await Role.exists({
      'reportingTo.id': new ObjectId(roleId),
    });

    if (hasReportingRoles) {
      return res.status(400).json({
        message: "Cannot delete role while other roles are reporting to it",
      });
    }

    await role.deleteOne();

    res.status(200).json({
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({
      message: "Error deleting role",
      error: error.message,
    });
  }
};

const ExtraEarning = require("../../models/extraEarning.model");
const Employee = require("../../models/employees.model");
const Department = require("../../models/department.model");

// Create a new extra earning
exports.createExtraEarning = async (req, res) => {
  try {
    const { name, description, amount, type, frequency } = req.body;
    const companyId = req.user.company;

    const extraEarning = new ExtraEarning({
      name,
      description,
      amount,
      type,
      frequency,
      company: companyId,
    });

    await extraEarning.save();

    res.status(201).json({
      message: "Extra earning created successfully",
      data: extraEarning,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating extra earning",
      error: error.message,
    });
  }
};

// Apply extra earning to employee or department
exports.applyExtraEarning = async (req, res) => {
  try {
    const { earning_id } = req.params;
    let { target_type, target_id, start_date, end_date } = req.body;
    const companyId = req.user.company;

    console.log(`Applying extra earning ${earning_id} to company ${companyId}`);

    // Validate input
    if (!target_type || !target_id) {
      return res.status(400).json({
        message: "Target type and target ID are required",
      });
    }

    // Validate target type
    const validTargetTypes = ["employee", "department"];
    if (!validTargetTypes.includes(target_type)) {
      return res.status(400).json({
        message: `Invalid target type. Must be one of: ${validTargetTypes.join(
          ", "
        )}`,
        validTypes: validTargetTypes,
        receivedType: target_type,
      });
    }

    // Validate target exists and belongs to company
    let target;
    if (target_type === "employee") {
      target = await Employee.findOne({ _id: target_id, company: companyId });
    } else if (target_type === "department") {
      target = await Department.findOne({ _id: target_id, company: companyId });
    }

    if (!target) {
      console.warn(`Target not found: ${target_type} with ID ${target_id}`);
      return res.status(404).json({
        message: `${target_type} not found or doesn't belong to company`,
      });
    }

    const extraEarning = await ExtraEarning.findOne({
      _id: earning_id,
      company: companyId,
    });

    if (!extraEarning) {
      return res.status(404).json({ message: "Extra earning not found" });
    }

    // Add application with explicit validation
    try {
      const newApplication = {
        target_type,
        target_id,
        start_date: start_date || new Date(),
        end_date,
        status: "active",
      };

      console.log("Applying new extra earning application:", newApplication);

      extraEarning.applications.push(newApplication);

      await extraEarning.save();
      console.log(`Extra earning ${earning_id} applied successfully`);
    } catch (validationError) {
      console.error(
        "Validation error applying extra earning:",
        validationError
      );
      return res.status(400).json({
        message: "Validation error applying extra earning",
        error: validationError.message,
        details: validationError.errors,
        receivedTargetType: req.body.target_type,
        processedTargetType: target_type,
      });
    }

    res.status(200).json({
      message: "Extra earning applied successfully",
      data: extraEarning,
    });
  } catch (error) {
    console.error("Full error in applyExtraEarning:", error);
    res.status(500).json({
      message: "Error applying extra earning",
      error: error.message,
      fullError: error,
    });
  }
};

// Get all extra earnings for a company
exports.getExtraEarnings = async (req, res) => {
  try {
    const companyId = req.user.company;
    const { status, target_type, target_id } = req.query;

    const query = { company: companyId };
    if (status) query.status = status;

    // Filter by target if provided
    if (target_type && target_id) {
      query["applications"] = {
        $elemMatch: {
          target_type,
          target_id,
          status: "active",
        },
      };
    }

    const extraEarnings = await ExtraEarning.find(query).sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: "Extra earnings retrieved successfully",
      data: extraEarnings,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving extra earnings",
      error: error.message,
    });
  }
};

// Update an extra earning
exports.updateExtraEarning = async (req, res) => {
  try {
    const { earning_id } = req.params;
    const companyId = req.user.company;
    const updates = req.body;

    const extraEarning = await ExtraEarning.findOneAndUpdate(
      { _id: earning_id, company: companyId },
      updates,
      { new: true }
    );

    if (!extraEarning) {
      return res.status(404).json({ message: "Extra earning not found" });
    }

    res.status(200).json({
      message: "Extra earning updated successfully",
      data: extraEarning,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating extra earning",
      error: error.message,
    });
  }
};

// Remove extra earning application
exports.removeApplication = async (req, res) => {
  try {
    const { earning_id, application_id } = req.params;
    const companyId = req.user.company;

    const extraEarning = await ExtraEarning.findOne({
      _id: earning_id,
      company: companyId,
    });

    if (!extraEarning) {
      return res.status(404).json({ message: "Extra earning not found" });
    }

    // Find and update the application status to inactive
    const application = extraEarning.applications.id(application_id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.status = "inactive";
    application.end_date = new Date();

    await extraEarning.save();

    res.status(200).json({
      message: "Extra earning application removed successfully",
      data: extraEarning,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error removing extra earning application",
      error: error.message,
    });
  }
};

// Delete an extra earning
exports.deleteExtraEarning = async (req, res) => {
  try {
    const { earning_id } = req.params;
    const companyId = req.user.company;

    const extraEarning = await ExtraEarning.findOneAndUpdate(
      { _id: earning_id, company: companyId },
      { status: "inactive" },
      { new: true }
    );

    if (!extraEarning) {
      return res.status(404).json({ message: "Extra earning not found" });
    }

    res.status(200).json({
      message: "Extra earning deleted successfully",
      data: extraEarning,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting extra earning",
      error: error.message,
    });
  }
};

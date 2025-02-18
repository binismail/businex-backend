const Deduction = require("../../models/deduction.model");
const Department = require("../../models/department.model");
const Employee = require("../../models/employees.model");

// Create a new deduction
exports.createDeduction = async (req, res) => {
  try {
    const { name, description, amount, type, frequency } = req.body;
    const companyId = req.user.company;

    const deduction = new Deduction({
      name,
      description,
      amount,
      type,
      frequency,
      company: companyId,
    });

    await deduction.save();

    res.status(201).json({
      message: "Deduction created successfully",
      data: deduction,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating deduction",
      error: error.message,
    });
  }
};

// Apply deduction to employee or department
exports.applyDeduction = async (req, res) => {
  try {
    const { deduction_id } = req.params;
    let { target_type, target_id, start_date, end_date } = req.body;
    const companyId = req.user.company;

    console.log(`Applying deduction ${deduction_id} to company ${companyId}`);

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

    const deduction = await Deduction.findOne({
      _id: deduction_id,
      company: companyId,
    });

    if (!deduction) {
      console.warn(`Deduction not found: ${deduction_id}`);
      return res.status(404).json({ message: "Deduction not found" });
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

      console.log("Applying new deduction application:", newApplication);

      // Remove the temporary validation as it's now handled in the pre-save middleware
      deduction.applications.push(newApplication);

      await deduction.save();
      console.log(`Deduction ${deduction_id} applied successfully`);
    } catch (validationError) {
      console.error("Validation error applying deduction:", validationError);
      return res.status(400).json({
        message: "Validation error applying deduction",
        error: validationError.message,
        details: validationError.errors,
        receivedTargetType: req.body.target_type,
        processedTargetType: target_type,
      });
    }

    res.status(200).json({
      message: "Deduction applied successfully",
      data: deduction,
    });
  } catch (error) {
    console.error("Full error in applyDeduction:", error);
    res.status(500).json({
      message: "Error applying deduction",
      error: error.message,
      fullError: error,
    });
  }
};
// Get all deductions for a company
exports.getDeductions = async (req, res) => {
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

    const deductions = await Deduction.find(query);

    res.status(200).json({
      message: "Deductions retrieved successfully",
      data: deductions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving deductions",
      error: error.message,
    });
  }
};

// Update a deduction
exports.updateDeduction = async (req, res) => {
  try {
    const { deduction_id } = req.params;
    const companyId = req.user.company;
    const updates = req.body;

    const deduction = await Deduction.findOneAndUpdate(
      { _id: deduction_id, company: companyId },
      updates,
      { new: true }
    );

    if (!deduction) {
      return res.status(404).json({ message: "Deduction not found" });
    }

    res.status(200).json({
      message: "Deduction updated successfully",
      data: deduction,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating deduction",
      error: error.message,
    });
  }
};

// Remove deduction application
exports.removeApplication = async (req, res) => {
  try {
    const { deduction_id, application_id } = req.params;
    const companyId = req.user.company;

    const deduction = await Deduction.findOne({
      _id: deduction_id,
      company: companyId,
    });

    if (!deduction) {
      return res.status(404).json({ message: "Deduction not found" });
    }

    // Find and update the application status to inactive
    const application = deduction.applications.id(application_id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.status = "inactive";
    application.end_date = new Date();

    await deduction.save();

    res.status(200).json({
      message: "Deduction application removed successfully",
      data: deduction,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error removing deduction application",
      error: error.message,
    });
  }
};

// Delete a deduction
exports.deleteDeduction = async (req, res) => {
  try {
    const { deduction_id } = req.params;
    const companyId = req.user.company;

    const deduction = await Deduction.findOneAndUpdate(
      { _id: deduction_id, company: companyId },
      { status: "inactive" },
      { new: true }
    );

    if (!deduction) {
      return res.status(404).json({ message: "Deduction not found" });
    }

    res.status(200).json({
      message: "Deduction deleted successfully",
      data: deduction,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting deduction",
      error: error.message,
    });
  }
};

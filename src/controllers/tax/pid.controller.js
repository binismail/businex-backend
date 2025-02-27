const TaxPid = require("../../models/taxPid.model");
const pidService = require("../../services/tax/pidService");
const Employee = require("../../models/employees.model");
const mongoose = require("mongoose");

exports.registerEmployeePid = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { employeeId, registrationType, idNumber, ...personalInfo } =
      req.body;
    const companyId = req.user.company;

    // Check if employee exists and belongs to the company
    const employee = await Employee.findOne({
      _id: employeeId,
      company: companyId,
    }).session(session);

    if (!employee) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // Check if PID already exists for this employee
    const existingPid = await TaxPid.findOne({
      employee: employeeId,
    }).session(session);

    if (existingPid && existingPid.status === "active") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Employee already has an active PID",
      });
    }

    // Prepare user data for PID creation
    const userData = {
      ...personalInfo,
      [registrationType === "BVN" ? "bvnNumber" : "ninNumber"]: idNumber,
    };

    // Create PID using appropriate method
    const pidResponse = await (registrationType === "BVN"
      ? pidService.createPidWithBVN(userData)
      : pidService.createPidWithNIN(userData));

    if (pidResponse.status !== "SUCCESS") {
      throw new Error(pidResponse.message || "PID creation failed");
    }

    // Create or update TaxPid record
    const taxPid =
      existingPid ||
      new TaxPid({
        employee: employeeId,
        company: companyId,
        registration_type: registrationType,
        id_number: idNumber,
        personal_info: personalInfo,
      });

    taxPid.pid = pidResponse.PID;
    taxPid.status = "active";
    taxPid.verification_history.push({
      status: "success",
      message: "PID created successfully",
    });

    await taxPid.save({ session });

    // Update employee record
    employee.tax_pid = pidResponse.PID;
    await employee.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "PID registration successful",
      data: {
        pid: pidResponse.PID,
        status: "active",
        employee: {
          id: employee._id,
          name: employee.name,
        },
      },
    });
  } catch (error) {
    console.error("PID registration error:", error);
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      message: "Error registering PID",
      error: error.message,
    });
  }
};

exports.verifyEmployeePid = async (req, res) => {
  try {
    const { pid } = req.params;
    const companyId = req.user.company;

    // Find the PID record
    const taxPid = await TaxPid.findOne({
      pid,
      company: companyId,
    }).populate("employee", "name email");

    if (!taxPid) {
      return res.status(404).json({
        message: "PID not found",
      });
    }

    // Verify PID with tax authority
    const verificationResponse = await pidService.verifyPid(pid);

    // Update verification history
    taxPid.verification_history.push({
      status: verificationResponse.status === "SUCCESS" ? "success" : "failed",
      message: verificationResponse.message,
    });

    taxPid.last_verified = new Date();
    taxPid.status =
      verificationResponse.status === "SUCCESS" ? "active" : "failed";

    await taxPid.save();

    res.status(200).json({
      message: "PID verification completed",
      data: {
        pid: taxPid.pid,
        status: taxPid.status,
        last_verified: taxPid.last_verified,
        employee: taxPid.employee,
      },
    });
  } catch (error) {
    console.error("PID verification error:", error);
    res.status(500).json({
      message: "Error verifying PID",
      error: error.message,
    });
  }
};

exports.getEmployeePidStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const companyId = req.user.company;

    const taxPid = await TaxPid.findOne({
      employee: employeeId,
      company: companyId,
    }).populate("employee", "name email");

    if (!taxPid) {
      return res.status(404).json({
        message: "PID record not found",
      });
    }

    res.status(200).json({
      data: {
        pid: taxPid.pid,
        status: taxPid.status,
        registration_type: taxPid.registration_type,
        last_verified: taxPid.last_verified,
        verification_history: taxPid.verification_history,
        employee: taxPid.employee,
      },
    });
  } catch (error) {
    console.error("Get PID status error:", error);
    res.status(500).json({
      message: "Error retrieving PID status",
      error: error.message,
    });
  }
};

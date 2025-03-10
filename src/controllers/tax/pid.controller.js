const Employee = require("../../models/employees.model");
const pidService = require("../../services/tax/pidService");

/**
 * Verify an employee's PID with the tax authority
 */
exports.verifyEmployeePid = async (req, res) => {
  try {
    const { pid } = req.params;
    const companyId = req.user.company;

    // Find the employee with this PID
    const employee = await Employee.findOne({
      tax_pid: pid,
      company: companyId,
    }).select('name email tax_pid');

    if (!employee) {
      return res.status(404).json({
        message: "Employee with this PID not found",
      });
    }

    // Verify PID with tax authority
    const verificationResponse = await pidService.verifyPid(pid);

    res.status(200).json({
      message: "PID verification completed",
      data: {
        pid: employee.tax_pid,
        status: verificationResponse.status,
        verified_at: new Date(),
        employee: {
          id: employee._id,
          name: employee.name,
          email: employee.email
        }
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

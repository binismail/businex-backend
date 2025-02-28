const express = require("express");
const { check } = require("express-validator");
const { checkUser } = require("../../middlewares/auth.middleware");
const permissionsByRole = require("../../utils/permission.enum");
const {
  createPayroll,
  getAllPayrolls,
  getPayrollById,
  updatePayroll,
  deletePayroll,
  processPayroll,
  schedulePayroll,
  getPayrollSummary,
  retryPayslipTransfer,
  removeEmployeeFromPayroll,
} = require("../../controllers/payroll/payroll.controller");

// router
const router = express.Router();

router.use(checkUser());

router.post(
  "/createPayroll",
  checkUser(permissionsByRole.admin),
  createPayroll
);

router.post("/schedule", checkUser(permissionsByRole.admin), schedulePayroll);

router.post(
  "/process/:payrollId",
  checkUser(permissionsByRole.admin),
  processPayroll
);

router.get("/summary", checkUser(permissionsByRole.admin), getPayrollSummary);

router.get("/getAllPayrolls", getAllPayrolls);

router.get("/getAllPayrollsById/:id", getPayrollById);

router.put(
  "/updatePayroll/:payrollId",
  checkUser(permissionsByRole.admin),
  updatePayroll
);

router.delete(
  "/deletePayroll/:payrollId",
  checkUser(permissionsByRole.admin),
  deletePayroll
);

// New route for retrying individual payslip transfers
router.post(
  "/:payrollId/payslips/:payslipId/retry",
  checkUser(permissionsByRole.admin),
  retryPayslipTransfer
);

// Route for removing an employee from payroll
router.delete(
  "/:payrollId/employees/:employeeId",
  checkUser(permissionsByRole.admin),
  removeEmployeeFromPayroll
);

// Reprocess failed payrolls
// router.post(
//   "/reprocess",
//   [checkUser(permissionsByRole.admin), checkUser(permissionsByRole.finance)],
//   reprocessFailedPayrolls
// );

module.exports = router;

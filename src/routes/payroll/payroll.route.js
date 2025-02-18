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
} = require("../../controllers/payroll/payroll.controller");
// router
const router = express.Router();

router.post(
  "/createPayroll",
  checkUser(permissionsByRole.admin),
  createPayroll
);

router.post(
  "/schedule",
  checkUser(permissionsByRole.admin),
  schedulePayroll
);

router.post(
  "/process/:payrollId",
  checkUser(permissionsByRole.admin),
  processPayroll
);

router.get(
  "/summary",
  checkUser(permissionsByRole.admin),
  getPayrollSummary
);

router.get(
  "/getAllPayrolls",
  checkUser(permissionsByRole.admin),
  getAllPayrolls
);

router.get(
  "/getAllPayrollsById/:id",
  checkUser(permissionsByRole.admin),
  getPayrollById
);

router.put("/updatePayroll/:payrollId", checkUser(permissionsByRole.admin), updatePayroll);

router.delete(
  "/deletePayroll",
  checkUser(permissionsByRole.admin),
  deletePayroll
);

module.exports = router;

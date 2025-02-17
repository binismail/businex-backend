const express = require("express");
const { checkUser } = require("../../middlewares/auth.middleware");
const permissionsByRole = require("../../utils/permission.enum");
const {
  createDeduction,
  applyDeduction,
  getDeductions,
  updateDeduction,
  removeApplication,
  deleteDeduction,
} = require("../../controllers/payroll/deduction.controller");

const router = express.Router();

// Create a new deduction
router.post(
  "/",
  checkUser(permissionsByRole.admin),
  createDeduction
);

// Apply deduction to employee or department
router.post(
  "/:deduction_id/apply",
  checkUser(permissionsByRole.admin),
  applyDeduction
);

// Get all deductions
router.get(
  "/",
  checkUser(permissionsByRole.admin),
  getDeductions
);

// Update a deduction
router.patch(
  "/:deduction_id",
  checkUser(permissionsByRole.admin),
  updateDeduction
);

// Remove deduction application
router.delete(
  "/:deduction_id/applications/:application_id",
  checkUser(permissionsByRole.admin),
  removeApplication
);

// Delete a deduction
router.delete(
  "/:deduction_id",
  checkUser(permissionsByRole.admin),
  deleteDeduction
);

module.exports = router;

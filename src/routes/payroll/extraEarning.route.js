const express = require("express");
const { checkUser } = require("../../middlewares/auth.middleware");
const permissionsByRole = require("../../utils/permission.enum");
const {
  createExtraEarning,
  applyExtraEarning,
  getExtraEarnings,
  updateExtraEarning,
  removeApplication,
  deleteExtraEarning,
} = require("../../controllers/payroll/extraEarning.controller");

const router = express.Router();

// Create a new extra earning
router.post(
  "/",
  checkUser(permissionsByRole.admin),
  createExtraEarning
);

// Apply extra earning to employee or department
router.post(
  "/:earning_id/apply",
  checkUser(permissionsByRole.admin),
  applyExtraEarning
);

// Get all extra earnings
router.get(
  "/",
  checkUser(permissionsByRole.admin),
  getExtraEarnings
);

// Update an extra earning
router.patch(
  "/:earning_id",
  checkUser(permissionsByRole.admin),
  updateExtraEarning
);

// Remove extra earning application
router.delete(
  "/:earning_id/applications/:application_id",
  checkUser(permissionsByRole.admin),
  removeApplication
);

// Delete an extra earning
router.delete(
  "/:earning_id",
  checkUser(permissionsByRole.admin),
  deleteExtraEarning
);

module.exports = router;

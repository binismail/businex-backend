const express = require("express");
const { checkUser } = require("../../middlewares/auth.middleware");
const permissionsByRole = require("../../utils/permission.enum");
const {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment
} = require("../../controllers/departments/department.controller");

const router = express.Router();

// Create department
router.post(
  "/",
  checkUser(permissionsByRole.admin),
  createDepartment
);

// Get all departments
router.get(
  "/",
  checkUser(permissionsByRole.admin),
  getDepartments
);

// Update department
router.put(
  "/:departmentId",
  checkUser(permissionsByRole.admin),
  updateDepartment
);

// Delete department
router.delete(
  "/:departmentId",
  checkUser(permissionsByRole.admin),
  deleteDepartment
);

module.exports = router;

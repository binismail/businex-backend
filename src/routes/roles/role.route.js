const express = require("express");
const router = express.Router();
const roleController = require("../../controllers/roles/role.controller");
const { checkUser } = require("../../middlewares/auth.middleware");
const permissionsByRole = require("../../utils/permission.enum");

// Create a new role
router.post("/", checkUser(permissionsByRole.admin), roleController.createRole);

// Get all roles with filtering and pagination
router.get("/", checkUser(permissionsByRole.admin), roleController.getRoles);

// Get role by ID
router.get(
  "/:roleId",
  checkUser(permissionsByRole.admin),
  roleController.getRoleById
);

// Update role
router.put(
  "/:roleId",
  checkUser(permissionsByRole.admin),
  roleController.updateRole
);

// Delete role
router.delete(
  "/:roleId",
  checkUser(permissionsByRole.admin),
  roleController.deleteRole
);

module.exports = router;

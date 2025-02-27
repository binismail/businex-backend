const express = require("express");
const { check } = require("express-validator");
const { checkUser } = require("../../middlewares/auth.middleware");
const permissionsByRole = require("../../utils/permission.enum");
const {
  createEmployee,
  createEmployees,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require("../../controllers/employees/employee.controller");

// router
const router = express.Router();

router.post(
  "/createEmployee",
  checkUser(permissionsByRole.admin),
  createEmployee
);

router.post(
  "/createEmployees",
  checkUser(permissionsByRole.admin),
  createEmployees
);
router.get(
  "/getAllEmployees",
  checkUser(permissionsByRole.admin),
  getAllEmployees
);

router.get(
  "/getEmployeeById/:id",
  checkUser(permissionsByRole.admin),
  getEmployeeById
);

router.put(
  "/updateEmployee/:id",
  checkUser(permissionsByRole.admin),
  updateEmployee
);

router.delete(
  "/deleteEmployee/:id",
  checkUser(permissionsByRole.admin),
  deleteEmployee
);

module.exports = router;

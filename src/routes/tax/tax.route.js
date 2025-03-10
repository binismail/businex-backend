const express = require("express");
const router = express.Router();
const pidController = require("../../controllers/tax/pid.controller");
const paymentController = require("../../controllers/tax/payment.controller");
const reportController = require("../../controllers/tax/report.controller");
const { param } = require("express-validator");
const permissionsByRole = require("../../utils/permission.enum");
const { checkUser } = require("../../middlewares/auth.middleware");

// PID Verification Route
router.get(
  "/pid/verify/:pid",
  checkUser(permissionsByRole.admin),
  [param("pid").notEmpty()],
  pidController.verifyEmployeePid
);

// Tax Payment Routes
router.post(
  "/payment/process/:taxTransactionId",
  checkUser(permissionsByRole.admin),
  [param("taxTransactionId").isMongoId()],
  paymentController.processTaxPayment
);

router.get(
  "/payment/status/:transactionId",
  checkUser(permissionsByRole.admin),
  [param("transactionId").isMongoId()],
  paymentController.getTaxTransactionStatus
);

// Tax Summary Routes
router.get(
  "/summary",
  checkUser(permissionsByRole.admin),
  reportController.getTaxSummary
);

router.get(
  "/employee/:employeeId/history",
  checkUser(permissionsByRole.admin),
  [param("employeeId").isMongoId()],
  reportController.getEmployeeTaxHistory
);

router.get(
  "/upcoming",
  checkUser(permissionsByRole.admin),
  reportController.getUpcomingTax
);

module.exports = router;

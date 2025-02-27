const express = require("express");
const router = express.Router();
const pidController = require("../../controllers/tax/pid.controller");
const paymentController = require("../../controllers/tax/payment.controller");
const reportController = require("../../controllers/tax/report.controller");
const { body, param } = require("express-validator");
const permissionsByRole = require("../../utils/permission.enum");
const { checkUser } = require("../../middlewares/auth.middleware");

// PID Management Routes
router.post(
  "/pid/register",
  checkUser(permissionsByRole.admin),
  [
    body("employeeId").isMongoId(),
    body("registrationType").isIn(["BVN", "NIN"]),
    body("idNumber").notEmpty(),
    body("title").notEmpty(),
    body("sex").isIn(["Male", "Female"]),
    body("lastName").notEmpty(),
    body("firstName").notEmpty(),
    body("maritalStatus").notEmpty(),
    body("dateOfBirth").isISO8601(),
    body("phoneNumber").notEmpty(),
    body("email").isEmail(),
    body("address").notEmpty(),
  ],
  pidController.registerEmployeePid
);

router.get(
  "/pid/verify/:pid",
  checkUser(permissionsByRole.admin),
  [param("pid").notEmpty()],
  pidController.verifyEmployeePid
);

router.get(
  "/pid/status/:employeeId",
  checkUser(permissionsByRole.admin),
  [param("employeeId").isMongoId()],
  pidController.getEmployeePidStatus
);

// Tax Payment Routes
router.post(
  "/payment/process/:taxTransactionId",
  checkUser(permissionsByRole.admin),
  [param("taxTransactionId").isMongoId()],
  paymentController.processTaxPayment
);

router.post(
  "/payment/retry/:taxTransactionId/:employeeId",
  checkUser(permissionsByRole.admin),
  [param("taxTransactionId").isMongoId(), param("employeeId").isMongoId()],
  paymentController.retryFailedPayment
);

router.get(
  "/payment/status/:taxTransactionId",
  checkUser(permissionsByRole.admin),
  [param("taxTransactionId").isMongoId()],
  paymentController.getTaxTransactionStatus
);

// Tax Report Routes
router.get(
  "/report/summary",
  checkUser(permissionsByRole.admin),
  [
    body("year").optional().isInt({ min: 2000, max: 2100 }),
    body("month").optional().isInt({ min: 1, max: 12 }),
  ],
  reportController.getTaxSummary
);

router.get(
  "/report/employee/:employeeId",
  checkUser(permissionsByRole.admin),
  [
    param("employeeId").isMongoId(),
    body("year").isInt({ min: 2000, max: 2100 }),
  ],
  reportController.getEmployeeTaxHistory
);

router.get(
  "/report/upcoming",
  checkUser(permissionsByRole.admin),
  reportController.getUpcomingTax
);

module.exports = router;

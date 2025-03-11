const express = require("express");
const { checkUser } = require("../../middlewares/auth.middleware");
const permissionsByRole = require("../../utils/permission.enum");
const { body, param } = require("express-validator");
const {
  saveOnboardingStep,
  getOnboardingProgress,
  completeOnboarding,
  reviewKycDocuments,
} = require("../../controllers/company/kyc/kyc.controller");

const router = express.Router();

// Onboarding routes
router.post(
  "/onboarding/save-step",
  checkUser(permissionsByRole.admin),
  saveOnboardingStep
);

router.get(
  "/onboarding/progress",
  checkUser(permissionsByRole.admin),
  getOnboardingProgress
);

router.post(
  "/onboarding/complete",
  checkUser(permissionsByRole.admin),
  completeOnboarding
);

// KYC review route
router.post(
  "/:companyId/kyc/review",
  checkUser(permissionsByRole.admin),
  [
    param("companyId").isMongoId(),
    body("documentType").isString().notEmpty(),
    body("status").isString().notEmpty(),
  ],
  reviewKycDocuments
);

module.exports = router;

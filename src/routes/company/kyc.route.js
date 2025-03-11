const express = require("express");
const { checkUser } = require("../../middleware/auth");
const { permissionsByRole } = require("../../utils/permissions");
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
  [
    body("step").isNumeric(),
    body("data").isObject(),
  ],
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
  checkUser(permissionsByRole.superAdmin),
  [
    param("companyId").isMongoId(),
    body("documentType").isString().notEmpty(),
    body("status").isString().notEmpty(),
  ],
  reviewKycDocuments
);

module.exports = router;

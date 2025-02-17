const express = require("express");
const { checkUser } = require("../../middlewares/auth.middleware");
const permissionsByRole = require("../../utils/permission.enum");
const {
  saveOnboardingStep,
  getOnboardingProgress,
  completeOnboarding,
  reviewKycDocuments,
} = require("../../controllers/company/kyc/kyc.controller");

const router = express.Router();

// Company onboarding routes
router.post(
  "/onboarding/step",
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
  checkUser(permissionsByRole.superAdmin),
  reviewKycDocuments
);

module.exports = router;

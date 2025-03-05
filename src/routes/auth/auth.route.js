const express = require("express");
const { check } = require("express-validator");
const { register } = require("../../controllers/auth/register.controller");
const {
  verifyOtp,
  accountLoginWEmail,
} = require("../../controllers/auth/login.controller");
const {
  requestPasswordReset,
  resetPassword,
} = require("../../controllers/auth/password-reset.controller");
const router = express.Router();

router.post("/register", register);
router.post("/login", accountLoginWEmail);
router.post("/verifyOtp", verifyOtp);

// Password reset routes
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

module.exports = router;

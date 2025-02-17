const express = require("express");
const { check } = require("express-validator");
const { register } = require("../../controllers/auth/register.controller");
const {
  verifyOtp,
  accountLoginWEmail,
} = require("../../controllers/auth/login.controller");
const { resetPassword } = require("../../controllers/auth/reset.controller");
const router = express.Router();

router.post("/register", register);
router.post("/login", accountLoginWEmail);
router.post("/verifyOtp", verifyOtp);

module.exports = router;

const express = require("express");
const { checkUser } = require("../../middlewares/auth.middleware");
const permissionsByRole = require("../../utils/permission.enum");
const {
  createCompanyWallet,
  getWalletBalance,
  getWalletAccountNumber
} = require("../../controllers/wallet/wallet.controller");

const router = express.Router();

// Create department
router.post("/", checkUser(permissionsByRole.admin), createCompanyWallet);

// Get all departments
router.get("/:companyId", checkUser(permissionsByRole.admin), getWalletBalance);

// Get wallet account number
router.get("/:companyId/account", checkUser(permissionsByRole.admin), getWalletAccountNumber);

module.exports = router;

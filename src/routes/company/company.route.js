const express = require("express");
const { checkUser } = require("../../middlewares/auth.middleware");
const permissionsByRole = require("../../utils/permission.enum");
const {
  getUserById,
  getCompanyById,
  getCompanyWallet,
} = require("../../controllers/company/retrieve/retrieve.controller");
// router
const router = express.Router();

router.get(
  "/getUserById/:userId",
  checkUser(permissionsByRole.admin),
  getUserById
);

router.get(
  "/getCompanyById/:id",
  checkUser(permissionsByRole.admin),
  getCompanyById
);

router.get(
  "/getWallet/:id",
  checkUser(permissionsByRole.admin),
  getCompanyWallet
);

module.exports = router;

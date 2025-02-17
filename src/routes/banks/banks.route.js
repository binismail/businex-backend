const express = require("express");
const { checkUser } = require("../../middlewares/auth.middleware");
const { getBanks, verifyBankAccount } = require("../../controllers/banks/banks.controller");

const router = express.Router();

router.get("/", checkUser(), getBanks);
router.post("/verify", checkUser(), verifyBankAccount);

module.exports = router;

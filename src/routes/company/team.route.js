const express = require("express");
const { check } = require("express-validator");
const { checkUser } = require("../../middlewares/auth.middleware");
const permissionsByRole = require("../../utils/permission.enum");
const {
  addTeamMember,
  removeTeamMember,
  editTeamMemberPermissions,
  processInvitation,
} = require("../../controllers/company/teams/teams.controller");
// router
const router = express.Router();

router.post(
  "/addTeamMember",
  checkUser(permissionsByRole.admin),
  addTeamMember
);

router.post(
  "/addTeamMember",
  checkUser(permissionsByRole.admin),
  addTeamMember
);

router.post(
  "/editTeamMemberPermissions/:userId",
  checkUser(permissionsByRole.admin),
  editTeamMemberPermissions
);

router.post(
  "/processTeamInvite/:token",
  checkUser(permissionsByRole.admin),
  processInvitation
);

module.exports = router;

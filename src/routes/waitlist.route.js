const express = require('express');
const { 
  signupWaitlist, 
  getWaitlist 
} = require('../controllers/waitlist.controller');
const { checkUser } = require('../middlewares/auth.middleware');
const permissionsByRole = require('../utils/permission.enum');

const router = express.Router();

// Public route for waitlist signup (no authentication required)
router.post('/', signupWaitlist);

// Protected route to get waitlist entries (admin only)
router.get('/', checkUser(permissionsByRole.admin), getWaitlist);

module.exports = router;

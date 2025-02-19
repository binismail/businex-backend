const express = require('express');
const router = express.Router();
const XpressWalletWebhookController = require('../controllers/webhook/xpressWallet.webhook.controller');

// Webhook route for Xpress Wallet
router.post('/xpress-wallet', XpressWalletWebhookController.handleWebhook);

module.exports = router;

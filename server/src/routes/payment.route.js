const express = require('express');
const paymentController = require('~/controllers/payment.controller');
const { authenticate } = require('~/middlewares/authenticate.middleware');

const router = express.Router();

router.post('/sepay/orders/:orderId/checkout', authenticate, paymentController.createSepayCheckout);

router.post('/sepay/webhook', paymentController.handleSepayWebhook);

module.exports = router;

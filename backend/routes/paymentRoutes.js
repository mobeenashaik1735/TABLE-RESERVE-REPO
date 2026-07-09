const express = require('express');
const router = express.Router();
const { createCheckoutSession, verifySession, completeMockPayment } = require('../controllers/paymentController');

router.post('/create-checkout-session', createCheckoutSession);
router.post('/verify-session', verifySession);
router.post('/mock-complete/:reservation_id', completeMockPayment);

module.exports = router;

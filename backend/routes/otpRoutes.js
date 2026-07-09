const express = require('express');
const router = express.Router();
const { sendOtp, verifyAndConfirm } = require('../controllers/otpController');

router.post('/send', sendOtp);
router.post('/verify-and-confirm', verifyAndConfirm);

module.exports = router;

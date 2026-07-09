const express = require('express');
const router = express.Router();
const { parseBookingIntent } = require('../controllers/chatbotController');

router.post('/parse', parseBookingIntent);

module.exports = router;

const express = require('express');
const router = express.Router();
const { confirmReservation, applyPayment, getUnifiedBookings } = require('../controllers/bookingController');

router.post('/confirm', confirmReservation);
router.post('/apply-payment', applyPayment);
router.get('/user/:user_id', getUnifiedBookings);

module.exports = router;

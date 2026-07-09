const express = require('express');
const router = express.Router();
const { getMyReservations, cancelReservation } = require('../controllers/reservationController');
const { getAvailableTables } = require('../controllers/tableAvailabilityController');

router.get('/available', getAvailableTables);
router.get('/user/:user_id', getMyReservations);
router.put('/:id/cancel', cancelReservation);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getReservationQr, verifyQr } = require('../controllers/qrController');

router.get('/:id', getReservationQr);
router.post('/verify', verifyQr);

module.exports = router;

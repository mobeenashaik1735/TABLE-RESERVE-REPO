const express = require('express');
const router = express.Router();
const { joinWaitlist, leaveWaitlist, getMyWaitlist } = require('../controllers/waitlistController');

router.post('/', joinWaitlist);
router.get('/user/:user_id', getMyWaitlist);
router.put('/:id/cancel', leaveWaitlist);

module.exports = router;

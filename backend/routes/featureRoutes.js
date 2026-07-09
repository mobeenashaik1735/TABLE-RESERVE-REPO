const express = require('express');
const router = express.Router();
const { getFloorMap } = require('../controllers/floorMapController');
const { calculateDynamicPrice } = require('../utils/pricing');

router.get('/floor-map', getFloorMap);

router.get('/pricing', (req, res) => {
  const { date, time } = req.query;
  if (!date || !time) {
    return res.status(400).json({ message: 'date and time are required' });
  }
  res.json(calculateDynamicPrice(date, time));
});

module.exports = router;

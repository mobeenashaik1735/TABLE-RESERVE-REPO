const express = require('express');
const router = express.Router();
const {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  getMyRestaurants,
} = require('../controllers/restaurantController');

router.get('/', getRestaurants);
router.get('/owner/:owner_id', getMyRestaurants);
router.get('/:id', getRestaurantById);
router.post('/', createRestaurant);

module.exports = router;
const express = require('express');
const router = express.Router();
const { register, login, getUserProfile, updateProfile } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/profile/:id', getUserProfile);
router.put('/profile/:id', updateProfile);

module.exports = router;
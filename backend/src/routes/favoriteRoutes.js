const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const favoriteController = require('../controllers/favoriteController');

router.post('/:houseId', protect, favoriteController.addFavorite);
router.delete('/:houseId', protect, favoriteController.removeFavorite);
router.get('/', protect, favoriteController.getFavorites);

module.exports = router;
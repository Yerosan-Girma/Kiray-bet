const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { upload } = require('../middleware/upload');
const { validate } = require('../middleware/validation');
const { createHouseValidator } = require('../validators/houseValidator');
const houseController = require('../controllers/houseController');

router.get('/', houseController.getHouses);
router.get('/nearby', houseController.getNearbyHouses);
router.get('/my-listings', protect, houseController.getMyListings);
router.get('/:id', houseController.getHouse);
router.post(
  '/',
  protect,
  authorize('owner', 'broker', 'admin'),
  upload.array('images', 10),
  validate(createHouseValidator),
  houseController.createHouse
);
router.put('/:id', protect, authorize('owner', 'broker', 'admin'), houseController.updateHouse);
router.delete('/:id', protect, authorize('owner', 'broker', 'admin'), houseController.deleteHouse);

module.exports = router;
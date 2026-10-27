const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize, requireApprovedBroker } = require('../middleware/role');
const { upload } = require('../middleware/upload');
const { validate } = require('../middleware/validation');
const { createHouseValidator } = require('../validators/houseValidator');
const houseController = require('../controllers/houseController');

router.get('/', houseController.getHouses);
router.get('/nearby', houseController.getNearbyHouses);
router.get('/my-listings', protect, houseController.getMyListings);
router.get('/my-owner-submissions', protect, authorize('owner', 'renter'), houseController.getOwnerSubmissions);
router.post('/upload-images', protect, upload.array('images', 10), houseController.uploadImages);
router.get('/:id', houseController.getHouse);
router.post(
  '/',
  protect,
  authorize('broker', 'admin'),
  (req, res, next) => (req.user.role === 'broker' ? requireApprovedBroker(req, res, next) : next()),
  houseController.createHouse
);
router.put('/:id', protect, authorize('broker', 'admin'),
  (req, res, next) => (req.user.role === 'broker' ? requireApprovedBroker(req, res, next) : next()),
  houseController.updateHouse);
router.delete('/:id', protect, authorize('broker', 'admin'),
  (req, res, next) => (req.user.role === 'broker' ? requireApprovedBroker(req, res, next) : next()),
  houseController.deleteHouse);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const rentController = require('../controllers/rentController');

// All routes require authentication
router.use(protect);

// Create rental agreement (Broker only)
router.post('/', authorize('broker'), rentController.createRentalAgreement);

// Get rentals for the authenticated user (Broker, Owner, Renter, Admin)
router.get('/my-rentals', rentController.getMyRentals);

// Get single rental by ID
router.get('/:id', rentController.getRentalById);

// Update rental status (Broker, Owner, Admin)
router.put('/:id/status', authorize('broker', 'owner', 'admin'), rentController.updateRentalStatus);

// Add payment record (Broker, Admin)
router.post('/:id/payments', authorize('broker', 'admin'), rentController.addPaymentRecord);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const brokerController = require('../controllers/brokerController');

// Public
router.get('/approved', brokerController.getApprovedBrokers);

// Any logged-in user can apply
router.post('/apply', protect, brokerController.applyBroker);

// Owner submits property to a broker
router.post('/submit-property', protect, authorize('owner', 'renter'), brokerController.ownerSubmitToBroker);

// Broker-only routes
router.get('/submissions', protect, authorize('broker'), brokerController.getMySubmissions);
router.put('/submissions/:houseId/respond', protect, authorize('broker'), brokerController.respondToSubmission);

// Admin routes
router.get('/applications', protect, authorize('admin'), brokerController.getBrokerApplications);
router.put('/applications/:userId/approve', protect, authorize('admin'), brokerController.approveBrokerApplication);
router.put('/applications/:userId/reject', protect, authorize('admin'), brokerController.rejectBrokerApplication);

module.exports = router;

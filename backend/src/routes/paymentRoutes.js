const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { createPaymentValidator } = require('../validators/paymentValidator');
const paymentController = require('../controllers/paymentController');

router.post('/create', protect, validate(createPaymentValidator), paymentController.createPayment);
router.get('/status/:id', protect, paymentController.getPaymentStatus);
router.get('/history', protect, paymentController.getPaymentHistory);
router.post('/callback', paymentController.paymentCallback); // webhook

module.exports = router;
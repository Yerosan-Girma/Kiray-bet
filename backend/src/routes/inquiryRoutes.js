const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { createInquiryValidator, replyValidator } = require('../validators/inquiryValidator');
const inquiryController = require('../controllers/inquiryController');

router.post('/', protect, validate(createInquiryValidator), inquiryController.createInquiry);
router.get('/', protect, inquiryController.getInquiries);
router.post('/:id/reply', protect, validate(replyValidator), inquiryController.addReply);

module.exports = router;
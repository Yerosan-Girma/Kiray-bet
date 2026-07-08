const { body } = require('express-validator');

const createInquiryValidator = [
  body('houseId').isMongoId().withMessage('Invalid house ID'),
  body('contactPhone').notEmpty().withMessage('Contact phone is required'),
  body('message').notEmpty().withMessage('Message is required'),
];

const replyValidator = [
  body('message').notEmpty().withMessage('Message is required'),
];

module.exports = { createInquiryValidator, replyValidator };
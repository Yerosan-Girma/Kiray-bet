// Placeholder for future admin-specific validators
const { body, param } = require('express-validator');

const suspendValidator = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date format'),
];

module.exports = { suspendValidator };
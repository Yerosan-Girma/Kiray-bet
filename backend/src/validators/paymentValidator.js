const { body } = require('express-validator');

const createPaymentValidator = [
  body('amount').isNumeric().withMessage('Amount must be a number').isInt({ min: 1 }),
  body('paymentMethod').isIn(['chapa', 'telebirr', 'mpesa']).withMessage('Invalid payment method'),
];

module.exports = { createPaymentValidator };
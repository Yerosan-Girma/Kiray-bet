const { body } = require('express-validator');

const createHouseValidator = [
  body('title').notEmpty().withMessage('Title is required').isLength({ max: 100 }),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isNumeric().withMessage('Price must be a number').isInt({ min: 0 }),
  body('location').notEmpty().withMessage('Location is required'),
  body('coordinates').custom(value => {
    if (!value || !value.coordinates || !Array.isArray(value.coordinates) || value.coordinates.length !== 2) {
      throw new Error('Coordinates must be { type: "Point", coordinates: [longitude, latitude] }');
    }
    return true;
  }),
  body('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),
  body('bathrooms').isInt({ min: 0 }).withMessage('Bathrooms must be a non-negative integer'),
  body('propertyType').isIn(['apartment', 'house', 'condo', 'studio', 'villa', 'townhouse']).withMessage('Invalid property type'),
  body('amenities').optional().isArray().withMessage('Amenities must be an array'),
  body('isPremium').optional().isBoolean(),
];

module.exports = { createHouseValidator };
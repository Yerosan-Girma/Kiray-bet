const { AppError } = require('../utils/AppError');
const logger = require('../utils/logger');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  let value = '';
  if (err.keyValue) {
    const keys = Object.keys(err.keyValue);
    value = `${keys.join(', ')}: ${Object.values(err.keyValue).join(', ')}`;
  } else if (err.message && err.message.match(/(["'])(\\?.)*?\1/)) {
    value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  } else if (err.errmsg && err.errmsg.match(/(["'])(\\?.)*?\1/)) {
    value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  } else {
    value = 'Duplicate value';
  }
  const message = `Duplicate field value: ${value}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = err.errors ? Object.values(err.errors).map((el) => el.message) : [err.message];
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  } else {
    logger.error('ERROR 💥', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
};

const errorHandler = (err, req, res, next) => {
  let error = err;
  error.statusCode = err.statusCode || 500;
  error.message = err.message || 'Internal Server Error';

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new AppError('Invalid JSON format in request body', 400);
  }
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = new AppError('Invalid token. Please log in again.', 401);
  if (err.name === 'TokenExpiredError') error = new AppError('Your token has expired. Please log in again.', 401);

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

module.exports = { errorHandler };

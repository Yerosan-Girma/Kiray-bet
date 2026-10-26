const { AppError } = require('../utils/AppError');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Role '${req.user.role}' not allowed`, 403));
    }
    next();
  };
};

const requireApprovedBroker = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }

  if (req.user.role !== 'broker') {
    return next(new AppError('Access restricted to brokers', 403));
  }

  // A broker is considered approved if isApproved is true OR brokerApplicationStatus is 'approved'
  if (!req.user.isApproved && req.user.brokerApplicationStatus !== 'approved') {
    return next(new AppError('Broker dashboard access requires admin approval. Please wait for your application to be reviewed.', 403));
  }

  if (req.user.status !== 'active') {
    return next(new AppError('Your broker account is not active', 403));
  }

  next();
};

module.exports = { authorize, requireApprovedBroker };

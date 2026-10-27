const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');
const { AppError } = require('./utils/AppError');
const logger = require('./utils/logger');

const app = express();

// Trust reverse proxy (Render, Cloudflare, Heroku) for HTTPS cookies & rate-limiting
app.set('trust proxy', 1);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
    ].filter(Boolean);
    if (allowedOrigins.includes(origin) || (typeof origin === 'string' && origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback to allow connection
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
}

// Rate limiting — skip in test mode to allow full test suite execution
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  skip: () => process.env.NODE_ENV === 'test',
});
app.use('/api', limiter);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/houses', require('./routes/houseRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes'));
app.use('/api/inquiries', require('./routes/inquiryRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/rentals', require('./routes/rentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/broker', require('./routes/brokerRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

// Health check
app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

// 404 handler for unknown routes
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// Error handling middleware (last)
app.use(errorHandler);

module.exports = app;

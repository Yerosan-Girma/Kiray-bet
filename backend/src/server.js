const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const http = require('http');

const app = require('./app');
const connectDB = require('./config/database');
const { initSocket } = require('./config/socket');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;


const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Initialize Socket.IO
initSocket(server);

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});
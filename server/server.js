// CodeSphere Realtime Server v1.0.8 - Automated Backup Cron & MFA Admin Operations
require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./socket/socket');
const { attachWsProxy } = require('./middlewares/vscodeProxy.middleware');
const { initBackupCron } = require('./cron/backupCron');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Attach VS Code Web WebSocket proxy (terminal, file-watch, hot-reload)
attachWsProxy(server);

// Initialize automated daily database backup cron job
initBackupCron();

// Connect to MongoDB & Start HTTP server
connectDB().then(() => {
  const { createIndexes } = require('./config/indexes');
  createIndexes().catch((err) => console.error('Failed to create database indexes:', err));
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} [Admin MFA & Automated Backups Active]`);
  });
}).catch((err) => {
  console.warn('MongoDB unavailable — starting server on fallback:', err.message);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} [Fallback Mode]`);
  });
});

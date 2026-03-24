require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Disable caching for API responses
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ status: 'OK', timestamp: new Date().toISOString(), db: 'Connected' });
  } catch (error) {
    res.status(500).json({ status: 'Error', db: 'Disconnected' });
  }
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/queues', require('./routes/queues'));
app.use('/api/rations', require('./routes/rations'));
app.use('/api/users', require('./routes/users'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/slots', require('./routes/slots'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/otp', require('./routes/otp'));
app.use('/api/reputation', require('./routes/reputation'));
app.use('/api/fraud', require('./routes/fraud'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/verify', require('./routes/verify'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing DB connection');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 SmartQueue Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
});


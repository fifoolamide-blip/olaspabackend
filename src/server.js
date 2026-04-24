const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { createTables } = require('./db');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Error Handler (must be last)
app.use(errorHandler);

// Database + Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Always start the HTTP server first so Railway's health checks pass
  // even if the Postgres reference variables haven't resolved yet.
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

  // Attempt an eager table-creation pass, but never crash the process on
  // failure — the pool is lazy-loaded, so tables will be created on the
  // first real query once the variables are available.
  try {
    await createTables();
    console.log('✅ PostgreSQL tables ready');
  } catch (err) {
    console.warn('⚠️  Startup table creation skipped — will retry on first query.');
    console.warn(err.message);
  }
};

startServer();

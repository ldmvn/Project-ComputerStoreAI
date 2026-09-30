// ============================================================================
// Server Entry Point — ComputerStoreAI Backend
// ----------------------------------------------------------------------------
// Phase 1: khởi tạo Express + middlewares cơ bản + health check.
// Phase tiếp theo sẽ mount app.js (full app config) tại đây.
// ============================================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './src/routes/v1/auth.route.js';

// ---------------------------------------------------------------------------
// App instance
// ---------------------------------------------------------------------------
const app = express();

// ---------------------------------------------------------------------------
// Core middlewares
// ---------------------------------------------------------------------------
const configuredOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    const isLocalDevelopment = !origin || /^https?:\/\/localhost(:\d+)?$/.test(origin);
    if (isLocalDevelopment || configuredOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Logger request cơ bản — Phase sau sẽ thay bằng morgan/winston
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend is running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/auth', authRoutes);

// ---------------------------------------------------------------------------
// 404 fallback
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    code: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.use((error, _req, res, _next) => {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.field ? { field: error.field } : {}),
    });
  }

  console.error('Unhandled API error:', error?.message || error);
  return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.' });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log('──────────────────────────────────────────────');
  console.log(`🚀 Backend is running at: http://localhost:${PORT}`);
  console.log(`❤️  Health check       : http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment        : ${process.env.NODE_ENV || 'development'}`);
  console.log('──────────────────────────────────────────────');
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received. Closing server gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;

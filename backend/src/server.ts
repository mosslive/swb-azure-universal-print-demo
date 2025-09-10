import express from 'express';
import cors from 'cors';
import { config } from './config';
import { validateToken, requireScope } from './middleware/auth';
import printersRouter from './routes/printers';
import printJobsRouter from './routes/printJobs';
import logger from './utils/logger';

const app = express();

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes with authentication
app.use('/api/printers', validateToken, requireScope('access_as_user'), printersRouter);
app.use('/api/print-jobs', validateToken, requireScope('access_as_user'), printJobsRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Handle multer errors
  if (err.message?.includes('Invalid file type')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: err.message,
    });
  }

  if (err.message?.includes('File too large')) {
    return res.status(400).json({
      error: 'File too large',
      message: 'File size must be less than 10MB',
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'production' ? 'Something went wrong' : err.message,
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Graceful shutdown initiated.`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const port = config.port;
app.listen(port, () => {
  logger.info(`Server started on port ${port}`, {
    environment: config.nodeEnv,
    corsOrigins: config.cors.origin,
  });
});

export default app;
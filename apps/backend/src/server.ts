import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import logger from '@utils/logger';
import { errorHandler } from '@middlewares/errorHandler';
import authRoutes from '@/routes/auth.routes';
import hallRoutes from '@/routes/hall.routes';
import clientRoutes from '@/routes/client.routes';
import eventTypeRoutes from '@/routes/eventType.routes';
import reservationRoutes from '@/routes/reservation.routes';

const app: Express = express();
const PORT = process.env.PORT || 3001;

/**
 * Security Middleware
 */
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

/**
 * Body Parsing Middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/**
 * Request Logging Middleware
 */
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

/**
 * Health Check Endpoint
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/halls', hallRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/event-types', eventTypeRoutes);
app.use('/api/reservations', reservationRoutes);

/**
 * 404 Handler
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

/**
 * Global Error Handler
 */
app.use(errorHandler);

/**
 * Start Server
 */
const server = app.listen(PORT, () => {
  logger.info(`\n🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📝 API Documentation: http://localhost:${PORT}/api/docs`);
  logger.info(`❤️  Health Check: http://localhost:${PORT}/api/health\n`);
});

/**
 * Graceful Shutdown
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

export default app;

import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cron from 'node-cron';
import logger from '@utils/logger';
import { errorHandler } from '@middlewares/errorHandler';
import authRoutes from '@/routes/auth.routes';
import hallRoutes from '@/routes/hall.routes';
import clientRoutes from '@/routes/client.routes';
import eventTypeRoutes from '@/routes/eventType.routes';
import reservationRoutes from '@/routes/reservation.routes';
import depositRoutes from '@/routes/deposit.routes';
import queueRoutes from '@/routes/queue.routes';
import menuRoutes from '@/routes/menu.routes';
import dishRoutes from '@/routes/dish.routes';
import dishCategoryRoutes from '@/routes/dish-category.routes';
import menuCalculatorRoutes from '@/routes/menu-calculator.routes';
import queueService from '@/services/queue.service';

const app: Express = express();
const PORT = process.env.PORT || 3001;

/**
 * CORS Allowed Origins
 * Add your frontend URLs here
 */
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://62.171.189.172:3001',
  process.env.CORS_ORIGIN,
].filter(Boolean); // Remove undefined values

/**
 * Security Middleware
 */
app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600, // 10 minutes
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
app.use('/api/deposits', depositRoutes);
app.use('/api/queue', queueRoutes);

/**
 * Menu System Routes
 * Includes:
 * - /api/menu-templates
 * - /api/menu-packages
 * - /api/menu-options
 * - /api/reservations/:id/select-menu (menu selection)
 */
app.use('/api', menuRoutes);

/**
 * Menu Calculator Routes (NEW)
 * - /api/menu-calculator/calculate
 * - /api/menu-calculator/packages/available
 * - /api/menu-calculator/option/:optionId/calculate
 */
app.use('/api/menu-calculator', menuCalculatorRoutes);

/**
 * Dishes Routes
 * - /api/dishes
 */
app.use('/api/dishes', dishRoutes);

/**
 * Dish Categories Routes
 * - /api/dish-categories
 */
app.use('/api/dish-categories', dishCategoryRoutes);

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
  logger.info(`📋 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
  logger.info(`📝 API Documentation: http://localhost:${PORT}/api/docs`);
  logger.info(`❤️  Health Check: http://localhost:${PORT}/api/health`);
  logger.info(`🍽️  Menu System: http://localhost:${PORT}/api/menu-templates`);
  logger.info(`🧮  Menu Calculator: http://localhost:${PORT}/api/menu-calculator/calculate`);
  logger.info(`💾  Menu Assignment: http://localhost:${PORT}/api/reservations/:id/menu`);
  logger.info(`🍲  Dishes: http://localhost:${PORT}/api/dishes`);
  logger.info(`📂  Categories: http://localhost:${PORT}/api/dish-categories\n`);
  
  // Setup cron job for auto-canceling expired RESERVED reservations
  setupAutoCancelCron();
});

/**
 * Setup Auto-Cancel Cron Job
 * Runs daily at 00:01 AM to cancel expired RESERVED reservations
 */
function setupAutoCancelCron() {
  // Run every day at 00:01 AM
  cron.schedule('1 0 * * *', async () => {
    logger.info('[CRON] Running auto-cancel for expired RESERVED reservations...');
    
    try {
      const result = await queueService.autoCancelExpired();
      
      if (result.cancelledCount > 0) {
        logger.info(
          `[CRON] Auto-cancel completed: ${result.cancelledCount} reservations cancelled`,
          { cancelledIds: result.cancelledIds }
        );
      } else {
        logger.info('[CRON] Auto-cancel completed: No expired reservations found');
      }
    } catch (error: any) {
      logger.error('[CRON] Auto-cancel failed:', error.message);
    }
  });
  
  logger.info('⏰ Auto-cancel cron job scheduled for 00:01 AM daily');
}

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

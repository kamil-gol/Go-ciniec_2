import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cron from 'node-cron';
import logger from '@utils/logger';
import { validateEnv } from '@/config/env';
import { errorHandler } from '@middlewares/errorHandler';
import authRoutes from '@/routes/auth.routes';
import hallRoutes from '@/routes/hall.routes';
import clientRoutes from '@/routes/client.routes';
import eventTypeRoutes from '@/routes/eventType.routes';
import reservationRoutes from '@/routes/reservation.routes';
import depositRoutes from '@/routes/deposit.routes';
import reservationDepositRoutes from '@/routes/reservation-deposit.routes';
import queueRoutes from '@/routes/queue.routes';
import menuRoutes from '@/routes/menu.routes';
import dishRoutes from '@/routes/dish.routes';
import dishCategoryRoutes from '@/routes/dish-category.routes';
import menuCalculatorRoutes from '@/routes/menu-calculator.routes';
import statsRoutes from '@/routes/stats.routes';
import attachmentRoutes from '@/routes/attachment.routes';
import auditLogRoutes from '@/routes/audit-log.routes';
import reportsRoutes from '@/routes/reports.routes';
import settingsRoutes from '@/routes/settings.routes';
import serviceExtraRoutes from '@/routes/serviceExtra.routes';
import queueService from '@/services/queue.service';
import depositService from '@/services/deposit.service';
import depositReminderService from '@/services/deposit-reminder.service';
import authService from '@/services/auth.service';
import archiveSchedulerService from '@/services/archive-scheduler.service';
import emailService from '@/services/email.service';

// Validate environment variables early
validateEnv();

const app: Express = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * CORS Allowed Origins
 *
 * Production: only CORS_ORIGIN from env
 * Development: CORS_ORIGIN + localhost defaults for convenience
 */
const devOrigins = isProduction
  ? []
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];

const envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : [];

const allowedOrigins = [...new Set([...devOrigins, ...envOrigins])].filter(Boolean);

/**
 * Security Middleware
 */
app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600,
  })
);

/**
 * Body Parsing Middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/**
 * UTF-8 Charset Middleware
 */
app.use((_req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson(body);
  };
  next();
});

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
app.use('/api/reservations/:reservationId/deposits', reservationDepositRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/audit-log', auditLogRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

/**
 * Menu System Routes
 */
app.use('/api', menuRoutes);

/**
 * Menu Calculator Routes
 */
app.use('/api/menu-calculator', menuCalculatorRoutes);

/**
 * Dishes Routes
 */
app.use('/api/dishes', dishRoutes);

/**
 * Dish Categories Routes
 */
app.use('/api/dish-categories', dishCategoryRoutes);

/**
 * Service Extras Routes
 */
app.use('/api/service-extras', serviceExtraRoutes);

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

// ========================================
// Export app for testing (supertest)
// MUST be before app.listen() so tests
// can import without starting the server.
// ========================================
export default app;

// ========================================
// Start Server (skip in test mode)
// ========================================
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(Number(PORT), HOST, () => {
    logger.info(`Server running on http://${HOST}:${PORT}`);
    logger.info(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);

    // Setup cron jobs
    setupAutoCancelCron();
    setupDepositOverdueCron();
    setupDepositReminderCron();
    setupArchiveCron();
    setupRefreshTokenCleanupCron();

    // Verify email on startup
    emailService.verify();
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
}

/**
 * Setup Auto-Cancel Cron Job
 */
function setupAutoCancelCron() {
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
  logger.info('Auto-cancel cron job scheduled for 00:01 AM daily');
}

/**
 * Setup Deposit Overdue Cron Job
 */
function setupDepositOverdueCron() {
  cron.schedule('0 6 * * *', async () => {
    logger.info('[CRON] Running deposit overdue check...');
    try {
      const result = await depositService.autoMarkOverdue();
      if (result.markedOverdueCount > 0) {
        logger.info(
          `[CRON] Deposit overdue check completed: ${result.markedOverdueCount} deposits marked as overdue`
        );
      } else {
        logger.info('[CRON] Deposit overdue check completed: No overdue deposits found');
      }
    } catch (error: any) {
      logger.error('[CRON] Deposit overdue check failed:', error.message);
    }
  });
  logger.info('Deposit overdue cron job scheduled for 06:00 AM daily');
}

/**
 * Setup Deposit Reminder Cron Job
 */
function setupDepositReminderCron() {
  cron.schedule('0 8 * * *', async () => {
    logger.info('[CRON] Running deposit email reminders...');
    try {
      const result = await depositReminderService.runReminders();
      logger.info(
        `[CRON] Deposit reminders completed: ${result.upcomingSent} upcoming, ${result.overdueSent} overdue, ${result.errors} errors`
      );
    } catch (error: any) {
      logger.error('[CRON] Deposit reminders failed:', error.message);
    }
  });
  logger.info('Deposit reminder cron job scheduled for 08:00 AM daily');
}

/**
 * Setup Auto-Archive Cron Job (#144)
 * Archives CANCELLED reservations older than ARCHIVE_AFTER_DAYS (default: 30).
 * Runs daily at 02:00 AM.
 */
function setupArchiveCron() {
  cron.schedule('0 2 * * *', async () => {
    logger.info('[CRON] Running auto-archive for old CANCELLED reservations...');
    try {
      const result = await archiveSchedulerService.archiveCancelled();
      if (result.archivedCount > 0) {
        logger.info(
          `[CRON] Auto-archive completed: ${result.archivedCount} reservations archived`,
          { archivedIds: result.archivedIds }
        );
      } else {
        logger.info('[CRON] Auto-archive completed: No reservations to archive');
      }
    } catch (error: any) {
      logger.error('[CRON] Auto-archive failed:', error.message);
    }
  });
  logger.info(`Auto-archive cron job scheduled for 02:00 AM daily (ARCHIVE_AFTER_DAYS=${process.env.ARCHIVE_AFTER_DAYS || 30})`);
}

/**
 * Setup Refresh Token Cleanup Cron Job (#145)
 * Deletes expired and revoked refresh tokens from DB daily at 03:00 AM.
 */
function setupRefreshTokenCleanupCron() {
  cron.schedule('0 3 * * *', async () => {
    logger.info('[CRON] Running refresh token cleanup...');
    try {
      const count = await authService.cleanupExpiredTokens();
      if (count > 0) {
        logger.info(`[CRON] Refresh token cleanup completed: ${count} tokens removed`);
      } else {
        logger.info('[CRON] Refresh token cleanup completed: No expired tokens found');
      }
    } catch (error: any) {
      logger.error('[CRON] Refresh token cleanup failed:', error.message);
    }
  });
  logger.info('Refresh token cleanup cron job scheduled for 03:00 AM daily');
}

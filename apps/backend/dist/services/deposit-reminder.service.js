/**
 * Deposit Reminder Service
 * Finds deposits that need reminders and sends emails
 *
 * Reminder schedule:
 *   - 7 days before due → first reminder
 *   - 3 days before due → second reminder
 *   - 1 day before due → final reminder
 *   - After due date → overdue notice (daily for 3 days, then every 3 days)
 */
import { prisma } from '../lib/prisma';
import emailService from './email.service';
import logger from '@utils/logger';
const REMINDER_DAYS = [7, 3, 1]; // days before due date
const OVERDUE_DAILY_LIMIT = 3; // send daily for first N days overdue
const OVERDUE_INTERVAL = 3; // then every N days
const depositReminderService = {
    /**
     * Run full reminder cycle (called by cron)
     * Returns summary of actions taken
     */
    async runReminders() {
        let upcomingSent = 0;
        let overdueSent = 0;
        let errors = 0;
        // 1. Upcoming reminders (7, 3, 1 days before)
        for (const daysLeft of REMINDER_DAYS) {
            try {
                const count = await this.sendUpcomingReminders(daysLeft);
                upcomingSent += count;
            }
            catch (error) {
                logger.error(`[Reminder] Error sending ${daysLeft}-day reminders: ${error.message}`);
                errors++;
            }
        }
        // 2. Overdue notices
        try {
            const count = await this.sendOverdueNotices();
            overdueSent += count;
        }
        catch (error) {
            logger.error(`[Reminder] Error sending overdue notices: ${error.message}`);
            errors++;
        }
        return { upcomingSent, overdueSent, errors };
    },
    /**
     * Send reminders for deposits due in exactly N days
     */
    async sendUpcomingReminders(daysLeft) {
        const targetDate = getDatePlusDays(daysLeft);
        // Find PENDING deposits with dueDate = targetDate that have a client email
        const deposits = await prisma.deposit.findMany({
            where: {
                status: { in: ['PENDING', 'PARTIALLY_PAID'] },
                dueDate: { equals: targetDate },
            },
            include: {
                reservation: {
                    include: {
                        client: true,
                        hall: true,
                        eventType: true,
                    },
                },
            },
        });
        let sentCount = 0;
        for (const deposit of deposits) {
            const client = deposit.reservation?.client;
            if (!client?.email) {
                logger.debug(`[Reminder] Skipping deposit ${deposit.id} — no client email`);
                continue;
            }
            const data = {
                clientName: `${client.firstName} ${client.lastName}`,
                depositAmount: Number(deposit.amount).toLocaleString('pl-PL'),
                dueDate: formatDatePL(deposit.dueDate),
                daysLeft,
                reservationDate: deposit.reservation?.date
                    ? formatDatePL(deposit.reservation.date)
                    : '—',
                hallName: deposit.reservation?.hall?.name || '—',
                eventType: deposit.reservation?.eventType?.name || '—',
                guestCount: deposit.reservation?.guests || 0,
            };
            const sent = await emailService.sendDepositReminder(client.email, data);
            if (sent)
                sentCount++;
        }
        if (sentCount > 0) {
            logger.info(`[Reminder] Sent ${sentCount} reminder(s) for deposits due in ${daysLeft} days`);
        }
        return sentCount;
    },
    /**
     * Send overdue notices for past-due deposits
     */
    async sendOverdueNotices() {
        const todayStr = getTodayStr();
        // Find OVERDUE or PENDING deposits with past dueDate
        const deposits = await prisma.deposit.findMany({
            where: {
                status: { in: ['OVERDUE', 'PENDING'] },
                paid: false,
                dueDate: { lt: todayStr },
            },
            include: {
                reservation: {
                    include: {
                        client: true,
                        hall: true,
                        eventType: true,
                    },
                },
            },
        });
        let sentCount = 0;
        for (const deposit of deposits) {
            const client = deposit.reservation?.client;
            if (!client?.email)
                continue;
            const daysOverdue = daysBetween(deposit.dueDate, todayStr);
            // Throttle: daily for first 3 days, then every 3 days
            if (daysOverdue > OVERDUE_DAILY_LIMIT && daysOverdue % OVERDUE_INTERVAL !== 0) {
                continue;
            }
            const data = {
                clientName: `${client.firstName} ${client.lastName}`,
                depositAmount: Number(deposit.amount).toLocaleString('pl-PL'),
                dueDate: formatDatePL(deposit.dueDate),
                daysOverdue,
                reservationDate: deposit.reservation?.date
                    ? formatDatePL(deposit.reservation.date)
                    : '—',
                hallName: deposit.reservation?.hall?.name || '—',
                eventType: deposit.reservation?.eventType?.name || '—',
            };
            const sent = await emailService.sendDepositOverdueNotice(client.email, data);
            if (sent)
                sentCount++;
        }
        if (sentCount > 0) {
            logger.info(`[Reminder] Sent ${sentCount} overdue notice(s)`);
        }
        return sentCount;
    },
};
// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════
function getTodayStr() {
    return new Date().toISOString().substring(0, 10);
}
function getDatePlusDays(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().substring(0, 10);
}
function daysBetween(dateStr1, dateStr2) {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    const diff = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}
function formatDatePL(dateStr) {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }
    catch {
        return dateStr;
    }
}
export default depositReminderService;
//# sourceMappingURL=deposit-reminder.service.js.map
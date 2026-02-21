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
declare const depositReminderService: {
    /**
     * Run full reminder cycle (called by cron)
     * Returns summary of actions taken
     */
    runReminders(): Promise<{
        upcomingSent: number;
        overdueSent: number;
        errors: number;
    }>;
    /**
     * Send reminders for deposits due in exactly N days
     */
    sendUpcomingReminders(daysLeft: number): Promise<number>;
    /**
     * Send overdue notices for past-due deposits
     */
    sendOverdueNotices(): Promise<number>;
};
export default depositReminderService;
//# sourceMappingURL=deposit-reminder.service.d.ts.map
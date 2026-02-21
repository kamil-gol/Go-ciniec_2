/**
 * Email Service
 * Nodemailer-based email sending with HTML templates
 *
 * Required env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * Example .env:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=noreply@gosciniec.pl
 *   SMTP_PASS=your-app-password
 *   SMTP_FROM="Gościniec <noreply@gosciniec.pl>"
 */
export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType?: string;
    }>;
}
export interface DepositReminderData {
    clientName: string;
    depositAmount: string;
    dueDate: string;
    daysLeft: number;
    reservationDate: string;
    hallName: string;
    eventType: string;
    guestCount: number;
}
export interface DepositOverdueData {
    clientName: string;
    depositAmount: string;
    dueDate: string;
    daysOverdue: number;
    reservationDate: string;
    hallName: string;
    eventType: string;
}
declare const emailService: {
    /**
     * Send a raw email
     */
    send(options: EmailOptions): Promise<boolean>;
    /**
     * Send deposit upcoming reminder (X days before due)
     */
    sendDepositReminder(to: string, data: DepositReminderData): Promise<boolean>;
    /**
     * Send deposit overdue notification
     */
    sendDepositOverdueNotice(to: string, data: DepositOverdueData): Promise<boolean>;
    /**
     * Send deposit payment confirmation WITH PDF attachment
     */
    sendDepositPaidConfirmation(to: string, data: {
        clientName: string;
        depositAmount: string;
        paidAt: string;
        paymentMethod: string;
        reservationDate: string;
        hallName: string;
        eventType: string;
    }, pdfBuffer?: Buffer): Promise<boolean>;
    /**
     * Verify SMTP connection
     */
    verify(): Promise<boolean>;
};
export default emailService;
//# sourceMappingURL=email.service.d.ts.map
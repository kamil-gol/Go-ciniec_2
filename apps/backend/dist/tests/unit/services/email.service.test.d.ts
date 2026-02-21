/**
 * Email Service — Comprehensive Unit Tests
 * Targets 44.82% branches. Covers: SMTP configured/not,
 * attachments, SMTP_FROM fallbacks, send errors, verify, templates.
 *
 * Strategy: The module reads process.env at runtime in send()/getTransporter(),
 * so we mock env vars directly and reset the cached transporter between tests
 * by re-requiring the module.
 */
declare const mockSendMail: jest.Mock<any, any, any>;
declare const mockVerify: jest.Mock<any, any, any>;
declare const mockCreateTransport: jest.Mock<{
    sendMail: jest.Mock<any, any, any>;
    verify: jest.Mock<any, any, any>;
}, [], any>;
declare function loadService(env?: Record<string, string>): {
    svc: any;
    restore: () => void;
};
declare let restoreFn: (() => void) | null;
//# sourceMappingURL=email.service.test.d.ts.map
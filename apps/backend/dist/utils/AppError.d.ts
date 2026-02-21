/**
 * Custom Application Error class
 * Replaces fragile string-matching on error.message for HTTP status codes
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(messageOrCode: string | number, codeOrMessage?: number | string, isOperational?: boolean);
    static badRequest(message: string): AppError;
    static unauthorized(message?: string): AppError;
    static forbidden(message?: string): AppError;
    static notFound(resource?: string): AppError;
    static conflict(message: string): AppError;
    static internal(message?: string): AppError;
}
//# sourceMappingURL=AppError.d.ts.map
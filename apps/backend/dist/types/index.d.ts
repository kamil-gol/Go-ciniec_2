import { Request } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
export interface JwtPayload {
    id: string;
    email: string;
    role: UserRole;
}
export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
//# sourceMappingURL=index.d.ts.map
/**
 * Auth Controller
 * Updated for RBAC — returns role + permissions on login and /me
 * FIX: token/user also at root level for backward compatibility with tests
 */
import { Response } from 'express';
export declare const authController: {
    register: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    login: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    getMe: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    getPasswordRequirements: (_req: any, res: Response) => void;
};
//# sourceMappingURL=auth.controller.d.ts.map
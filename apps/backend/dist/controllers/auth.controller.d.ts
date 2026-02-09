import { Response } from 'express';
export declare const authController: {
    /**
     * POST /api/auth/register
     */
    register: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * POST /api/auth/login
     */
    login: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * GET /api/auth/me
     */
    getMe: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * GET /api/auth/password-requirements
     */
    getPasswordRequirements: (_req: any, res: Response) => void;
};
//# sourceMappingURL=auth.controller.d.ts.map
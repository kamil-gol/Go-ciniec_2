/**
 * Users Controller — User management for Settings module
 */
import { Request, Response } from 'express';
export declare class UsersController {
    getUsers(req: Request, res: Response): Promise<void>;
    getUserById(req: Request, res: Response): Promise<void>;
    createUser(req: Request, res: Response): Promise<void>;
    updateUser(req: Request, res: Response): Promise<void>;
    changePassword(req: Request, res: Response): Promise<void>;
    toggleActive(req: Request, res: Response): Promise<void>;
    deleteUser(req: Request, res: Response): Promise<void>;
}
declare const _default: UsersController;
export default _default;
//# sourceMappingURL=users.controller.d.ts.map
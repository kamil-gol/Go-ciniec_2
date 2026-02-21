/**
 * Roles Controller — Role management for Settings module
 */
import { Request, Response } from 'express';
export declare class RolesController {
    getRoles(_req: Request, res: Response): Promise<void>;
    getRoleById(req: Request, res: Response): Promise<void>;
    createRole(req: Request, res: Response): Promise<void>;
    updateRole(req: Request, res: Response): Promise<void>;
    updateRolePermissions(req: Request, res: Response): Promise<void>;
    deleteRole(req: Request, res: Response): Promise<void>;
}
declare const _default: RolesController;
export default _default;
//# sourceMappingURL=roles.controller.d.ts.map
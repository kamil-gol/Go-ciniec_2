/**
 * Menu Option Controller - with userId for audit
 */
import { Request, Response, NextFunction } from 'express';
declare class MenuOptionController {
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    delete(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const menuOptionController: MenuOptionController;
export {};
//# sourceMappingURL=menuOption.controller.d.ts.map
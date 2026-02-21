/**
 * Menu Package Controller - with userId for audit
 */
import { Request, Response, NextFunction } from 'express';
export declare class MenuPackageController {
    list(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    listByEventType(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    listByTemplate(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getById(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    create(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    update(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    delete(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    reorder(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    assignOptions(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const menuPackageController: MenuPackageController;
//# sourceMappingURL=menuPackage.controller.d.ts.map
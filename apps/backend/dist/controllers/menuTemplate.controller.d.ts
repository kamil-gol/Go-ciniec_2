/**
 * Menu Template Controller - with userId for audit
 */
import { Request, Response, NextFunction } from 'express';
export declare class MenuTemplateController {
    list(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getById(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getActive(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    create(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    update(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    delete(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    duplicate(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    downloadPdf(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
export declare const menuTemplateController: MenuTemplateController;
//# sourceMappingURL=menuTemplate.controller.d.ts.map
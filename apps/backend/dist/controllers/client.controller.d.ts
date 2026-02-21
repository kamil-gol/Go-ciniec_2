/**
 * Client Controller
 * MIGRATED: AppError + no try/catch
 */
import { Request, Response } from 'express';
export declare class ClientController {
    createClient(req: Request, res: Response): Promise<void>;
    getClients(req: Request, res: Response): Promise<void>;
    getClientById(req: Request, res: Response): Promise<void>;
    updateClient(req: Request, res: Response): Promise<void>;
    deleteClient(req: Request, res: Response): Promise<void>;
}
declare const _default: ClientController;
export default _default;
//# sourceMappingURL=client.controller.d.ts.map
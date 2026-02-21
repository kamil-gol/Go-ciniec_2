/**
 * Attachment Controller
 * Handles HTTP requests for attachment CRUD operations
 * Updated: Phase 3 Audit — pass userId to mutating service methods
 */
import { Request, Response, NextFunction } from 'express';
declare class AttachmentController {
    /**
     * Upload a new attachment
     * POST /api/attachments
     */
    upload(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get attachments for an entity
     * GET /api/attachments?entityType=X&entityId=Y&category=Z&withClientRodo=true
     */
    getByEntity(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Download attachment file
     * GET /api/attachments/:id/download
     */
    download(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update attachment metadata
     * PATCH /api/attachments/:id
     */
    update(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Soft-delete (archive) attachment
     * DELETE /api/attachments/:id
     */
    delete(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Archive attachment
     * PATCH /api/attachments/:id/archive
     */
    archive(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Check if entity has specific category
     * GET /api/attachments/check?entityType=X&entityId=Y&category=Z
     */
    check(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Batch check RODO for multiple clients
     * POST /api/attachments/batch-check-rodo
     */
    batchCheckRodo(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Batch check contracts for multiple reservations
     * POST /api/attachments/batch-check-contract
     */
    batchCheckContract(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
declare const _default: AttachmentController;
export default _default;
//# sourceMappingURL=attachment.controller.d.ts.map
/**
 * Attachment Controller
 * Handles HTTP requests for attachment CRUD operations
 * Updated: Phase 3 Audit — pass userId to mutating service methods
 */
import attachmentService from '../services/attachment.service';
class AttachmentController {
    /**
     * Upload a new attachment
     * POST /api/attachments
     */
    async upload(req, res, next) {
        try {
            const file = req.file;
            if (!file) {
                return res.status(400).json({ error: 'Nie przesłano pliku' });
            }
            const dto = {
                entityType: req.body.entityType,
                entityId: req.body.entityId,
                category: req.body.category,
                label: req.body.label || undefined,
                description: req.body.description || undefined,
            };
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Brak autoryzacji' });
            }
            const attachment = await attachmentService.createAttachment(dto, file, userId);
            return res.status(201).json({ data: attachment });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get attachments for an entity
     * GET /api/attachments?entityType=X&entityId=Y&category=Z&withClientRodo=true
     */
    async getByEntity(req, res, next) {
        try {
            const { entityType, entityId, category, withClientRodo } = req.query;
            if (!entityType || !entityId) {
                return res.status(400).json({ error: 'entityType i entityId są wymagane' });
            }
            // If withClientRodo=true, use the cross-reference method
            if (withClientRodo === 'true' && entityType !== 'CLIENT') {
                const attachments = await attachmentService.getAttachmentsWithClientRodo(entityType, entityId);
                return res.json({ data: attachments });
            }
            const attachments = await attachmentService.getAttachments({
                entityType: entityType,
                entityId: entityId,
                category: category,
            });
            return res.json({ data: attachments });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Download attachment file
     * GET /api/attachments/:id/download
     */
    async download(req, res, next) {
        try {
            const { id } = req.params;
            const { filePath, attachment } = await attachmentService.getFilePath(id);
            res.setHeader('Content-Type', attachment.mimeType);
            res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
            return res.sendFile(filePath);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update attachment metadata
     * PATCH /api/attachments/:id
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const dto = req.body;
            const userId = req.user?.id;
            const updated = await attachmentService.updateAttachment(id, dto, userId);
            return res.json({ data: updated });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Soft-delete (archive) attachment
     * DELETE /api/attachments/:id
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            await attachmentService.deleteAttachment(id, userId);
            return res.json({ message: 'Załącznik zarchiwizowany' });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Archive attachment
     * PATCH /api/attachments/:id/archive
     */
    async archive(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const archived = await attachmentService.deleteAttachment(id, userId);
            return res.json({ data: archived });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Check if entity has specific category
     * GET /api/attachments/check?entityType=X&entityId=Y&category=Z
     */
    async check(req, res, next) {
        try {
            const { entityType, entityId, category } = req.query;
            if (!entityType || !entityId || !category) {
                return res.status(400).json({ error: 'entityType, entityId i category są wymagane' });
            }
            const has = await attachmentService.hasAttachment(entityType, entityId, category);
            return res.json({ data: { has } });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Batch check RODO for multiple clients
     * POST /api/attachments/batch-check-rodo
     */
    async batchCheckRodo(req, res, next) {
        try {
            const { clientIds } = req.body;
            if (!Array.isArray(clientIds) || clientIds.length === 0) {
                return res.status(400).json({ error: 'clientIds musi być niepustą tablicą' });
            }
            const result = await attachmentService.batchCheckRodo(clientIds);
            return res.json({ data: result });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Batch check contracts for multiple reservations
     * POST /api/attachments/batch-check-contract
     */
    async batchCheckContract(req, res, next) {
        try {
            const { reservationIds } = req.body;
            if (!Array.isArray(reservationIds) || reservationIds.length === 0) {
                return res.status(400).json({ error: 'reservationIds musi być niepustą tablicą' });
            }
            const result = await attachmentService.batchCheckContract(reservationIds);
            return res.json({ data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
export default new AttachmentController();
//# sourceMappingURL=attachment.controller.js.map
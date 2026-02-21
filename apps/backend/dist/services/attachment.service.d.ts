/**
 * Attachment Service
 * CRUD operations for polymorphic file attachments
 *
 * RODO redirect: When RODO is uploaded via RESERVATION or DEPOSIT,
 * the attachment is automatically stored under the CLIENT entity.
 * This ensures all RODO documents are in one place per client.
 *
 * Updated: Phase 3 Audit — logChange() for all CRUD operations
 */
import { CreateAttachmentDTO, UpdateAttachmentDTO, AttachmentFilters } from '../types/attachment.types';
import { EntityType } from '../constants/attachmentCategories';
declare class AttachmentService {
    /**
     * Move file from staging to correct entity subdirectory.
     * Returns the relative storagePath for DB.
     */
    private moveToEntityDir;
    /**
     * Resolve the clientId from a RESERVATION or DEPOSIT entity.
     * Used for RODO redirect — always store RODO under CLIENT.
     */
    private resolveClientId;
    /**
     * Create attachment record after file upload.
     *
     * RODO REDIRECT: If category is RODO and entityType is RESERVATION or DEPOSIT,
     * the attachment is automatically redirected to entityType=CLIENT with the
     * resolved clientId. This ensures RODO is always stored at the client level.
     */
    createAttachment(dto: CreateAttachmentDTO, file: Express.Multer.File, uploadedById: string): Promise<{
        uploadedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        entityType: string;
        entityId: string;
        category: string;
        version: number;
        label: string | null;
        originalName: string;
        storedName: string;
        mimeType: string;
        sizeBytes: number;
        storagePath: string;
        isArchived: boolean;
        uploadedById: string;
    }>;
    /**
     * Get attachments for an entity
     */
    getAttachments(filters: AttachmentFilters): Promise<({
        uploadedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        entityType: string;
        entityId: string;
        category: string;
        version: number;
        label: string | null;
        originalName: string;
        storedName: string;
        mimeType: string;
        sizeBytes: number;
        storagePath: string;
        isArchived: boolean;
        uploadedById: string;
    })[]>;
    /**
     * Get attachments for an entity + cross-referenced RODO from client.
     * Used by RESERVATION and DEPOSIT views to show RODO stored at client level.
     */
    getAttachmentsWithClientRodo(entityType: EntityType, entityId: string, includeArchived?: boolean): Promise<({
        uploadedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        entityType: string;
        entityId: string;
        category: string;
        version: number;
        label: string | null;
        originalName: string;
        storedName: string;
        mimeType: string;
        sizeBytes: number;
        storagePath: string;
        isArchived: boolean;
        uploadedById: string;
    })[]>;
    /**
     * Get single attachment by ID
     */
    getAttachmentById(id: string): Promise<{
        uploadedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        entityType: string;
        entityId: string;
        category: string;
        version: number;
        label: string | null;
        originalName: string;
        storedName: string;
        mimeType: string;
        sizeBytes: number;
        storagePath: string;
        isArchived: boolean;
        uploadedById: string;
    }>;
    /**
     * Get full file path for download
     */
    getFilePath(id: string): Promise<{
        filePath: string;
        attachment: any;
    }>;
    /**
     * Update attachment metadata
     */
    updateAttachment(id: string, dto: UpdateAttachmentDTO, userId?: string): Promise<{
        uploadedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        entityType: string;
        entityId: string;
        category: string;
        version: number;
        label: string | null;
        originalName: string;
        storedName: string;
        mimeType: string;
        sizeBytes: number;
        storagePath: string;
        isArchived: boolean;
        uploadedById: string;
    }>;
    /**
     * Soft-delete attachment (set isArchived=true)
     */
    deleteAttachment(id: string, userId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        entityType: string;
        entityId: string;
        category: string;
        version: number;
        label: string | null;
        originalName: string;
        storedName: string;
        mimeType: string;
        sizeBytes: number;
        storagePath: string;
        isArchived: boolean;
        uploadedById: string;
    }>;
    /**
     * Hard-delete attachment (remove file + DB record)
     * Only for admin cleanup
     */
    hardDeleteAttachment(id: string, userId?: string): Promise<void>;
    /**
     * Count attachments by category for an entity
     */
    countByCategory(entityType: EntityType, entityId: string): Promise<Record<string, number>>;
    /**
     * Check if entity has specific category attachment
     */
    hasAttachment(entityType: EntityType, entityId: string, category: string): Promise<boolean>;
    /**
     * Batch check RODO status for multiple clients
     */
    batchCheckRodo(clientIds: string[]): Promise<Record<string, boolean>>;
    /**
     * Batch check contract status for multiple reservations
     */
    batchCheckContract(reservationIds: string[]): Promise<Record<string, boolean>>;
    /**
     * Validate that the referenced entity exists
     */
    private validateEntityExists;
}
declare const _default: AttachmentService;
export default _default;
//# sourceMappingURL=attachment.service.d.ts.map
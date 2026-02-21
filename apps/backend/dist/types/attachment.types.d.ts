/**
 * Attachment Types
 */
import { EntityType } from '../constants/attachmentCategories';
export interface CreateAttachmentDTO {
    entityType: EntityType;
    entityId: string;
    category: string;
    label?: string;
    description?: string;
}
export interface UpdateAttachmentDTO {
    label?: string;
    description?: string;
    category?: string;
}
export interface AttachmentFilters {
    entityType: EntityType;
    entityId: string;
    category?: string;
    includeArchived?: boolean;
}
export interface AttachmentResponse {
    id: string;
    entityType: string;
    entityId: string;
    category: string;
    label: string | null;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    description: string | null;
    isArchived: boolean;
    version: number;
    uploadedBy: {
        id: string;
        firstName: string;
        lastName: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=attachment.types.d.ts.map
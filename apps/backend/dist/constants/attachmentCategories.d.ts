/**
 * Attachment Categories per Entity Type
 * Shared constants for frontend and backend validation
 */
export declare const ENTITY_TYPES: readonly ["CLIENT", "RESERVATION", "DEPOSIT"];
export type EntityType = typeof ENTITY_TYPES[number];
export interface AttachmentCategoryDef {
    value: string;
    label: string;
    description?: string;
}
export declare const ATTACHMENT_CATEGORIES: Record<EntityType, AttachmentCategoryDef[]>;
/**
 * Get valid categories for a given entity type
 */
export declare function getValidCategories(entityType: EntityType): string[];
/**
 * Check if a category is valid for an entity type
 */
export declare function isValidCategory(entityType: EntityType, category: string): boolean;
/**
 * Allowed MIME types for upload
 */
export declare const ALLOWED_MIME_TYPES: readonly ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];
/**
 * Max file size in bytes (10 MB)
 */
export declare const MAX_FILE_SIZE: number;
/**
 * Storage subdirectories per entity type
 */
export declare const STORAGE_DIRS: Record<EntityType, string>;
//# sourceMappingURL=attachmentCategories.d.ts.map
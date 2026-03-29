/**
 * Attachment Categories per Entity Type
 * Shared constants for frontend and backend validation
 */

export const ENTITY_TYPES = ['CLIENT', 'RESERVATION', 'DEPOSIT', 'CATERING_ORDER'] as const;
export type EntityType = typeof ENTITY_TYPES[number];

export interface AttachmentCategoryDef {
  value: string;
  label: string;
  description?: string;
}

export const ATTACHMENT_CATEGORIES: Record<EntityType, AttachmentCategoryDef[]> = {
  CLIENT: [
    { value: 'RODO', label: 'Zgoda RODO', description: 'Podpisana zgoda na przetwarzanie danych osobowych' },
    { value: 'CORRESPONDENCE', label: 'Korespondencja', description: 'Skany ustaleń mailowych, SMS, screenshots' },
    { value: 'OTHER', label: 'Inne', description: 'Inne dokumenty klienta' },
  ],
  RESERVATION: [
    { value: 'RODO', label: 'Zgoda RODO', description: 'Podpisana zgoda RODO — zostanie automatycznie przypisana do klienta' },
    { value: 'CONTRACT', label: 'Umowa', description: 'Podpisana umowa rezerwacji' },
    { value: 'ANNEX', label: 'Aneks', description: 'Aneks do umowy (zmiana warunków)' },
    { value: 'POST_EVENT', label: 'Dokumentacja powykonawcza', description: 'Protokół zdania sali, zdjęcia' },
    { value: 'OTHER', label: 'Inne', description: 'Inne dokumenty rezerwacji' },
  ],
  DEPOSIT: [
    { value: 'RODO', label: 'Zgoda RODO', description: 'Podpisana zgoda RODO — zostanie automatycznie przypisana do klienta' },
    { value: 'PAYMENT_PROOF', label: 'Potwierdzenie przelewu', description: 'Skan/screenshot operacji bankowej' },
    { value: 'INVOICE', label: 'Faktura zaliczkowa', description: 'Faktura VAT za wpłaconą zaliczkę' },
    { value: 'REFUND_PROOF', label: 'Potwierdzenie zwrotu', description: 'Dokument potwierdzający zwrot' },
    { value: 'OTHER', label: 'Inne', description: 'Inne dokumenty zaliczki' },
  ],
  CATERING_ORDER: [
    { value: 'RODO', label: 'Zgoda RODO', description: 'Podpisana zgoda RODO — zostanie automatycznie przypisana do klienta' },
    { value: 'CONTRACT', label: 'Umowa catering', description: 'Podpisana umowa na usługę cateringową' },
    { value: 'INVOICE', label: 'Faktura', description: 'Faktura VAT za zamówienie cateringowe' },
    { value: 'MENU', label: 'Menu / karta dań', description: 'Uzgodnione menu, karta dań klienta' },
    { value: 'DIETARY', label: 'Wymagania dietetyczne', description: 'Informacje o alergiach, dietach, preferencjach' },
    { value: 'CORRESPONDENCE', label: 'Korespondencja', description: 'Ustalenia mailowe, SMS, screenshots rozmów' },
    { value: 'OTHER', label: 'Inne', description: 'Inne dokumenty zamówienia cateringowego' },
  ],
};

/**
 * Get valid categories for a given entity type
 */
export function getValidCategories(entityType: EntityType): string[] {
  const categories = ATTACHMENT_CATEGORIES[entityType];
  if (!categories) return [];
  return categories.map(c => c.value);
}

/**
 * Check if a category is valid for an entity type
 */
export function isValidCategory(entityType: EntityType, category: string): boolean {
  return getValidCategories(entityType).includes(category);
}

/**
 * Allowed MIME types for upload
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
] as const;

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

/**
 * Human-readable file type labels (for error messages)
 */
export const MIME_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/gif': 'GIF',
  'image/webp': 'WebP',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'text/csv': 'CSV',
};

/**
 * Max file size in bytes (25 MB)
 */
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Storage subdirectories per entity type
 */
export const STORAGE_DIRS: Record<EntityType, string> = {
  CLIENT: 'clients',
  RESERVATION: 'reservations',
  DEPOSIT: 'deposits',
  CATERING_ORDER: 'catering_orders',
};

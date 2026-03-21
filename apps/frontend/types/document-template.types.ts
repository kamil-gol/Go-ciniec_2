// apps/frontend/types/document-template.types.ts

// ── Category enum (matches backend seed) ────────────────

export type TemplateCategory =
  | 'RESERVATION_PDF'
  | 'CATERING_PDF'
  | 'EMAIL'
  | 'EMAIL_LAYOUT'
  | 'PDF_LAYOUT_CONFIG'
  | 'POLICY';

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  RESERVATION_PDF: 'Rezerwacje — PDF',
  CATERING_PDF: 'Catering — PDF',
  EMAIL: 'E-mail',
  EMAIL_LAYOUT: 'Layout e-mail',
  PDF_LAYOUT_CONFIG: 'Konfiguracja PDF',
  POLICY: 'Regulaminy',
};

export const TEMPLATE_CATEGORY_ORDER: TemplateCategory[] = [
  'RESERVATION_PDF',
  'CATERING_PDF',
  'EMAIL',
  'EMAIL_LAYOUT',
  'PDF_LAYOUT_CONFIG',
  'POLICY',
];

// ── Main model ──────────────────────────────────────

export interface DocumentTemplate {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  content: string;
  category: TemplateCategory;
  format?: string;
  availableVars: string[];
  isRequired: boolean;
  isActive: boolean;
  version: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ── History entry ───────────────────────────────────

export interface DocumentTemplateHistory {
  id: string;
  templateId: string;
  content: string;
  version: number;
  changeReason: string | null;
  changedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

// ── Preview result ──────────────────────────────────

export interface PreviewResult {
  content: string;
  unfilledVars: string[];
  templateName: string;
  templateSlug: string;
}

// ── API response wrappers ───────────────────────────

export interface TemplateListResponse {
  success: boolean;
  count: number;
  data: DocumentTemplate[];
}

export interface TemplateSingleResponse {
  success: boolean;
  data: DocumentTemplate;
}

export interface TemplatePreviewResponse {
  success: boolean;
  data: PreviewResult;
}

export interface TemplateHistoryResponse {
  success: boolean;
  data: {
    items: DocumentTemplateHistory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Create DTO ──────────────────────────────────────

export interface CreateTemplateInput {
  slug: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  content: string;
  availableVars?: string[];
}

// ── Update DTO ──────────────────────────────────────

export interface UpdateTemplateInput {
  content: string;
  name?: string;
  description?: string;
  availableVars?: string[];
  changeReason?: string;
}

/**
 * Document Template Service
 * Business logic for managing document templates with versioning.
 *
 * Features:
 *   - List/get templates with optional category filter
 *   - Create new templates
 *   - Update with auto-versioning (old content → history table)
 *   - Delete (blocked for isRequired templates)
 *   - Restore historical version
 *   - Preview with {{variable}} substitution
 *   - Paginated change history
 */

import { prisma } from '@/lib/prisma';
import { logChange, diffObjects } from '../utils/audit-logger';
import { AppError } from '../utils/AppError';

// ── Types ────────────────────────────────────────────────

interface CreateTemplateDTO {
  slug: string;
  name: string;
  description?: string;
  category: string;
  content: string;
  availableVars?: string[];
  isActive?: boolean;
  isRequired?: boolean;
}

interface UpdateTemplateDTO {
  content: string;
  name?: string;
  description?: string;
  availableVars?: string[];
  changeReason?: string;
}

interface PreviewResult {
  content: string;
  unfilledVars: string[];
  templateName: string;
  templateSlug: string;
}

interface PaginatedHistory {
  items: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const VALID_CATEGORIES = ['RESERVATION_PDF', 'CATERING_PDF', 'EMAIL', 'POLICY', 'GENERAL'];

// ── Service ──────────────────────────────────────────────

export class DocumentTemplateService {
  /**
   * List all templates, optionally filtered by category.
   * Returns templates ordered by displayOrder.
   */
  async list(filters?: { category?: string }) {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    return prisma.documentTemplate.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Get a single template by its unique slug.
   */
  async getBySlug(slug: string) {
    const template = await prisma.documentTemplate.findUnique({
      where: { slug },
    });

    if (!template) {
      throw AppError.notFound('Szablon');
    }

    return template;
  }

  /**
   * Create a new document template.
   */
  async create(data: CreateTemplateDTO, userId: string) {
    // Validate category
    if (!VALID_CATEGORIES.includes(data.category)) {
      throw AppError.badRequest(
        `Nieprawidłowa kategoria. Dozwolone: ${VALID_CATEGORIES.join(', ')}`
      );
    }

    // Validate slug format
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
      throw AppError.badRequest(
        'Slug może zawierać tylko małe litery, cyfry i myślniki (np. my-template-name)'
      );
    }

    // Check for duplicate slug
    const existing = await prisma.documentTemplate.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw AppError.badRequest(`Szablon o slug "${data.slug}" już istnieje`);
    }

    // Determine next displayOrder
    const maxOrder = await prisma.documentTemplate.aggregate({
      _max: { displayOrder: true },
      where: { category: data.category },
    });
    const nextOrder = (maxOrder._max.displayOrder || 0) + 1;

    const template = await prisma.documentTemplate.create({
      data: {
        slug: data.slug,
        name: data.name,
        description: data.description || null,
        category: data.category,
        content: data.content,
        availableVars: data.availableVars || [],
        version: 1,
        isActive: data.isActive ?? true,
        isRequired: false, // User-created templates are never required
        displayOrder: nextOrder,
      },
    });

    await logChange({
      userId,
      action: 'CREATE',
      entityType: 'DOCUMENT_TEMPLATE',
      entityId: template.id,
      details: {
        description: `Utworzono szablon: ${template.name} (${template.slug})`,
      },
    });

    return template;
  }

  /**
   * Update template content with auto-versioning.
   *
   * Flow:
   *  1. Save current content → DocumentTemplateHistory
   *  2. Increment version counter
   *  3. Apply new content + optional metadata changes
   *  4. Write audit log
   */
  async update(slug: string, data: UpdateTemplateDTO, userId: string) {
    const existing = await prisma.documentTemplate.findUnique({
      where: { slug },
    });

    if (!existing) {
      throw AppError.notFound('Szablon');
    }

    // Step 1: Archive current version to history
    await prisma.documentTemplateHistory.create({
      data: {
        templateId: existing.id,
        content: existing.content,
        version: existing.version,
        changedById: userId,
        changeReason: data.changeReason || `Wersja ${existing.version}`,
      },
    });

    // Step 2: Build update payload
    const updateData: any = {
      content: data.content,
      version: existing.version + 1,
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.availableVars !== undefined) updateData.availableVars = data.availableVars;

    // Step 3: Apply update
    const updated = await prisma.documentTemplate.update({
      where: { slug },
      data: updateData,
    });

    // Step 4: Audit log
    const changes = diffObjects(existing, updated);
    if (Object.keys(changes).length > 0) {
      await logChange({
        userId,
        action: 'UPDATE',
        entityType: 'DOCUMENT_TEMPLATE',
        entityId: updated.id,
        details: {
          description: `Zaktualizowano szablon: ${updated.name} (v${updated.version})`,
          changeReason: data.changeReason || undefined,
          changes,
        },
      });
    }

    return updated;
  }

  /**
   * Delete a template.
   * Blocks deletion of templates marked as isRequired.
   * Also removes all history records.
   */
  async delete(slug: string, userId: string) {
    const template = await prisma.documentTemplate.findUnique({
      where: { slug },
    });

    if (!template) {
      throw AppError.notFound('Szablon');
    }

    if (template.isRequired) {
      throw AppError.badRequest(
        `Szablon "${template.name}" jest wymagany przez system i nie może zostać usunięty`
      );
    }

    // Delete history first (foreign key constraint)
    await prisma.documentTemplateHistory.deleteMany({
      where: { templateId: template.id },
    });

    await prisma.documentTemplate.delete({
      where: { slug },
    });

    await logChange({
      userId,
      action: 'DELETE',
      entityType: 'DOCUMENT_TEMPLATE',
      entityId: template.id,
      details: {
        description: `Usunięto szablon: ${template.name} (${template.slug})`,
      },
    });

    return { deleted: true, slug: template.slug, name: template.name };
  }

  /**
   * Restore a historical version of a template.
   *
   * Flow:
   *  1. Find the history entry with the given version number
   *  2. Archive current content to history
   *  3. Set template content to the restored version
   *  4. Increment version counter
   */
  async restore(slug: string, version: number, userId: string) {
    const template = await prisma.documentTemplate.findUnique({
      where: { slug },
    });

    if (!template) {
      throw AppError.notFound('Szablon');
    }

    // Find the historical version
    const historyEntry = await prisma.documentTemplateHistory.findFirst({
      where: {
        templateId: template.id,
        version: version,
      },
    });

    if (!historyEntry) {
      throw AppError.notFound(`Wersja ${version} szablonu`);
    }

    // Archive current version before restoring
    await prisma.documentTemplateHistory.create({
      data: {
        templateId: template.id,
        content: template.content,
        version: template.version,
        changedById: userId,
        changeReason: `Przed przywróceniem wersji ${version}`,
      },
    });

    // Restore: set content from history, bump version
    const restored = await prisma.documentTemplate.update({
      where: { slug },
      data: {
        content: historyEntry.content,
        version: template.version + 1,
      },
    });

    await logChange({
      userId,
      action: 'UPDATE',
      entityType: 'DOCUMENT_TEMPLATE',
      entityId: restored.id,
      details: {
        description: `Przywrócono wersję ${version} szablonu: ${restored.name} (teraz v${restored.version})`,
      },
    });

    return restored;
  }

  /**
   * Preview template with {{variable}} substitution.
   *
   * Replaces all `{{key}}` placeholders with provided values.
   * Returns the rendered content + list of unfilled variables.
   */
  async preview(
    slug: string,
    variables: Record<string, string>
  ): Promise<PreviewResult> {
    const template = await prisma.documentTemplate.findUnique({
      where: { slug },
    });

    if (!template) {
      throw AppError.notFound('Szablon');
    }

    // Replace variables
    let rendered = template.content;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        String(value)
      );
    }

    // Detect unfilled variables
    const unfilledMatches = rendered.match(/\{\{(\w+)\}\}/g) || [];
    const unfilledVars = [
      ...new Set(unfilledMatches.map((v) => v.replace(/\{\{|\}\}/g, ''))),
    ];

    return {
      content: rendered,
      unfilledVars,
      templateName: template.name,
      templateSlug: template.slug,
    };
  }

  /**
   * Get paginated change history for a template.
   * Includes user who made each change.
   */
  async getHistory(
    slug: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedHistory> {
    const template = await prisma.documentTemplate.findUnique({
      where: { slug },
    });

    if (!template) {
      throw AppError.notFound('Szablon');
    }

    const [items, total] = await Promise.all([
      prisma.documentTemplateHistory.findMany({
        where: { templateId: template.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          changedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.documentTemplateHistory.count({
        where: { templateId: template.id },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export default new DocumentTemplateService();

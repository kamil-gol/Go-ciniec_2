/**
 * Document Template Service
 * Business logic for managing document templates with versioning.
 *
 * Features:
 *   - List/get templates with optional category filter
 *   - Update with auto-versioning (old content → history table)
 *   - Preview with {{variable}} substitution
 *   - Paginated change history
 */

import { prisma } from '@/lib/prisma';
import { logChange, diffObjects } from '../utils/audit-logger';
import { AppError } from '../utils/AppError';

// ── Types ────────────────────────────────────────────────

interface UpdateTemplateDTO {
  content: string;
  name?: string;
  description?: string;
  availableVars?: string[];
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
        changeReason: `Wersja ${existing.version}`,
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
          changes,
        },
      });
    }

    return updated;
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

// apps/backend/src/services/attachments/batch-queries.ts

/**
 * Batch attachment queries (counts, status checks).
 * Extracted from attachment.service.ts.
 */

import { prisma } from '../../lib/prisma';
import { EntityType } from '../../constants/attachmentCategories';

/**
 * Count attachments by category for an entity.
 */
export async function countByCategory(entityType: EntityType, entityId: string): Promise<Record<string, number>> {
  const counts = await prisma.attachment.groupBy({
    by: ['category'],
    where: {
      entityType,
      entityId,
      isArchived: false,
    },
    _count: { id: true },
  });

  return counts.reduce((acc, item) => {
    acc[item.category] = item._count.id;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Check if entity has specific category attachment.
 */
export async function hasAttachment(entityType: EntityType, entityId: string, category: string): Promise<boolean> {
  const count = await prisma.attachment.count({
    where: {
      entityType,
      entityId,
      category,
      isArchived: false,
    },
  });
  return count > 0;
}

/**
 * Batch check RODO status for multiple clients.
 */
export async function batchCheckRodo(clientIds: string[]): Promise<Record<string, boolean>> {
  const rodoAttachments = await prisma.attachment.findMany({
    where: {
      entityType: 'CLIENT',
      entityId: { in: clientIds },
      category: 'RODO',
      isArchived: false,
    },
    select: { entityId: true },
    distinct: ['entityId'],
  });

  const rodoSet = new Set(rodoAttachments.map(a => a.entityId));

  return clientIds.reduce((acc, id) => {
    acc[id] = rodoSet.has(id);
    return acc;
  }, {} as Record<string, boolean>);
}

/**
 * Batch check contract status for multiple reservations.
 */
export async function batchCheckContract(reservationIds: string[]): Promise<Record<string, boolean>> {
  const contractAttachments = await prisma.attachment.findMany({
    where: {
      entityType: 'RESERVATION',
      entityId: { in: reservationIds },
      category: 'CONTRACT',
      isArchived: false,
    },
    select: { entityId: true },
    distinct: ['entityId'],
  });

  const contractSet = new Set(contractAttachments.map(a => a.entityId));

  return reservationIds.reduce((acc, id) => {
    acc[id] = contractSet.has(id);
    return acc;
  }, {} as Record<string, boolean>);
}

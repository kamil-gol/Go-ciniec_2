/**
import { getErrorMessage } from '@/utils/AppError';
 * Queue Helpers
 * Utility functions, formatters, and retry logic for queue operations
 */

import { Prisma } from '@/prisma-client';
import { QueueItemResponse } from '../../types/queue.types';

/**
 * Retry an operation with exponential backoff on Prisma lock errors.
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> => {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      const isLockError =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' ||
        getErrorMessage(error)?.includes('lock_not_available') ||
        getErrorMessage(error)?.includes('55P03');
      if (!isLockError || attempt === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  /* istanbul ignore next -- unreachable: loop always returns or throws */
  throw lastError;
};

/**
 * Format a raw reservation record into a QueueItemResponse.
 */
export function formatQueueItem(reservation: any): QueueItemResponse {
  return {
    id: reservation.id,
    position: reservation.reservationQueuePosition || 0,
    queueDate: reservation.reservationQueueDate,
    guests: reservation.guests,
    client: {
      id: reservation.client.id, firstName: reservation.client.firstName,
      lastName: reservation.client.lastName, phone: reservation.client.phone,
      email: reservation.client.email
    },
    isManualOrder: reservation.queueOrderManual,
    notes: reservation.notes,
    createdAt: reservation.createdAt,
    createdBy: {
      id: reservation.createdBy.id, firstName: reservation.createdBy.firstName,
      lastName: reservation.createdBy.lastName
    }
  };
}

/**
 * Build start-of-day / end-of-day boundaries for a given date.
 */
export function dayBounds(date: Date): { startOfDay: Date; endOfDay: Date } {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
}

/**
 * Extract a client display name from a reservation that includes a client relation.
 */
export function clientDisplayName(reservation: { client?: { firstName: string; lastName: string } | null }): string {
  return reservation.client
    ? `${reservation.client.firstName} ${reservation.client.lastName}`
    : 'N/A';
}

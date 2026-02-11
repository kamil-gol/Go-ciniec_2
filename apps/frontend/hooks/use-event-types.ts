/**
 * Event Types Hook
 */

import { useQuery } from '@tanstack/react-query';
import { getEventTypes, getEventTypeById } from '@/lib/api/event-types-api';

const QUERY_KEY = 'event-types';

/**
 * Get all event types
 */
export function useEventTypes(activeOnly: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEY, 'list', activeOnly],
    queryFn: () => getEventTypes(activeOnly),
  });
}

/**
 * Get single event type by ID
 */
export function useEventType(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => getEventTypeById(id!),
    enabled: !!id,
  });
}

// apps/frontend/components/audit-log/audit-log.utils.ts
// Extracted from AuditLogTable.tsx — utility functions

import type { AuditLogEntry } from '@/types/audit-log.types';
import { SYSTEM_ACTIONS } from './audit-log.constants';

// #217: Group entries with same entityId within 5s window
export interface LogGroup {
  primary: AuditLogEntry;
  related: AuditLogEntry[];
}

export function groupLogEntries(entries: AuditLogEntry[]): LogGroup[] {
  if (entries.length === 0) return [];

  const groups: LogGroup[] = [];
  const used = new Set<string>();

  for (let i = 0; i < entries.length; i++) {
    if (used.has(entries[i].id)) continue;

    const primary = entries[i];
    const related: AuditLogEntry[] = [];
    const primaryTime = new Date(primary.createdAt).getTime();

    // Look for related entries (same entityId, within 5s, different action)
    for (let j = i + 1; j < entries.length; j++) {
      if (used.has(entries[j].id)) continue;
      const candidate = entries[j];
      const timeDiff = Math.abs(new Date(candidate.createdAt).getTime() - primaryTime);

      if (timeDiff > 5000) break; // entries are sorted by time desc, so we can break

      if (candidate.entityId === primary.entityId && candidate.action !== primary.action) {
        related.push(candidate);
        used.add(candidate.id);
      }
    }

    used.add(primary.id);
    groups.push({ primary, related });
  }

  return groups;
}

export function isSystemAction(action: string): boolean {
  return SYSTEM_ACTIONS.has(action);
}

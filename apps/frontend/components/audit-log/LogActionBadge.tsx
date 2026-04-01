// apps/frontend/components/audit-log/LogActionBadge.tsx
// Extracted from AuditLogTable.tsx — shared badge component for log actions

import { Badge } from '@/components/ui/badge';
import { actionColors, actionLabels } from './audit-log.constants';

export function LogActionBadge({ action, size = 'normal' }: { action: string; size?: 'normal' | 'small' }) {
  const sizeClass = size === 'small' ? 'text-[9px]' : 'text-xs';
  return (
    <Badge
      variant="outline"
      className={`${sizeClass} font-medium whitespace-nowrap ${actionColors[action] || 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'}`}
    >
      {actionLabels[action] || action}
    </Badge>
  );
}

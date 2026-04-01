import type { DepositStatus } from '@/lib/api/deposits'
import { StatusBadge } from '@/components/shared/StatusBadge'

/**
 * DepositStatusBadge — Thin wrapper around shared StatusBadge.
 * Delegates all styling/icons/labels to lib/status-colors.ts.
 */
export function DepositStatusBadge({ status }: { status: DepositStatus }) {
  return <StatusBadge type="deposit" status={status} />
}

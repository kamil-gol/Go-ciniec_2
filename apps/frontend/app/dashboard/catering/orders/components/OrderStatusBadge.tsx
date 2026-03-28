import type { CateringOrderStatus } from '@/types/catering-order.types'
import { StatusBadge } from '@/components/shared/StatusBadge'

/**
 * OrderStatusBadge — Thin wrapper around shared StatusBadge.
 * Delegates all styling/icons/labels to lib/status-colors.ts.
 */
export function OrderStatusBadge({ status }: { status: CateringOrderStatus }) {
  return <StatusBadge type="catering" status={status} />
}

// apps/frontend/src/app/dashboard/catering/orders/components/OrderStatusBadge.tsx
import { Badge } from '@/components/ui/badge';
import type { CateringOrderStatus } from '@/types/catering-order.types';
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/types/catering-order.types';

export function OrderStatusBadge({ status }: { status: CateringOrderStatus }) {
  return (
    <Badge className={`${ORDER_STATUS_COLOR[status]}`} variant="outline">
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  );
}

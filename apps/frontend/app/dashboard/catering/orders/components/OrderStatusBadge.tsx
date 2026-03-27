import { Badge } from '@/components/ui/badge';
import type { CateringOrderStatus } from '@/types/catering-order.types';
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/types/catering-order.types';
import {
  FileEdit,
  MessageSquare,
  Send,
  CheckCircle,
  Clock,
  PackageCheck,
  Truck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ORDER_STATUS_ICON: Record<CateringOrderStatus, LucideIcon> = {
  DRAFT: FileEdit,
  INQUIRY: MessageSquare,
  QUOTED: Send,
  CONFIRMED: CheckCircle,
  IN_PREPARATION: Clock,
  READY: PackageCheck,
  DELIVERED: Truck,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
};

export function OrderStatusBadge({ status }: { status: CateringOrderStatus }) {
  const Icon = ORDER_STATUS_ICON[status];
  return (
    <Badge className={`${ORDER_STATUS_COLOR[status]}`} variant="outline">
      {Icon && <Icon className="h-3 w-3 mr-1" />}
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  );
}

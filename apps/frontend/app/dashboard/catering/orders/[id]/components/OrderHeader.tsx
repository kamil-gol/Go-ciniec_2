import {
  ArrowLeft,
  Edit,
  MoreVertical,
  Trash2,
  CalendarDays,
  Users,
  Truck,
  Receipt,
  Sparkles,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { moduleAccents } from '@/lib/design-tokens';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { DELIVERY_TYPE_LABEL } from '@/types/catering-order.types';
import { StatPill } from './SectionCard';
import { formatPrice, formatDatePl } from './types';
import type { CateringOrder } from './types';

interface OrderHeaderProps {
  order: CateringOrder;
  pricePerGuest: number | null;
  canDelete: boolean;
  onBack: () => void;
  onEdit: () => void;
  onChangeStatus: () => void;
  onDelete: () => void;
  onDownloadPDF: () => void;
}

export function OrderHeader({
  order,
  pricePerGuest,
  canDelete,
  onBack,
  onEdit,
  onChangeStatus,
  onDelete,
  onDownloadPDF,
}: OrderHeaderProps) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${moduleAccents.catering.gradient} px-6 py-8 text-white`}>
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute right-32 bottom-0 h-24 w-24 rounded-full bg-white/5" />

      <div className="relative max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors py-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> Powrót
          </button>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost"
              className="text-white/90 hover:text-white hover:bg-white/20 border border-white/30 h-9 px-4"
              onClick={onDownloadPDF}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Pobierz PDF
            </Button>
            <Button size="sm" variant="ghost"
              className="text-white/90 hover:text-white hover:bg-white/20 border border-white/30 h-9 px-4"
              onClick={onChangeStatus}
            >
              Zmień status
            </Button>
            <Button size="sm" variant="ghost"
              className="text-white/90 hover:text-white hover:bg-white/20 border border-white/30 h-9 px-4"
              onClick={onEdit}
            >
              <Edit className="mr-1.5 h-3.5 w-3.5" /> Edytuj
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost"
                  className="text-white/90 hover:text-white hover:bg-white/20 border border-white/30 h-9 w-9 p-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={!canDelete}
                  className="text-destructive focus:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Usuń zamówienie
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-white/60 text-sm tracking-wide">{order.orderNumber}</span>
          <OrderStatusBadge status={order.status} />
        </div>

        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-6">
          {order.eventName ?? 'Zamówienie cateringowe'}
        </h1>

        <div className="flex flex-wrap gap-3">
          {order.eventDate && (
            <StatPill icon={CalendarDays} label="Data" value={formatDatePl(order.eventDate)} />
          )}
          <StatPill icon={Users} label="Osób" value={String(order.guestsCount)} />
          <StatPill icon={Receipt} label="Wartość" value={formatPrice(order.totalPrice)} />
          {pricePerGuest !== null && (
            <StatPill icon={Sparkles} label="/ os." value={formatPrice(pricePerGuest)} />
          )}
          <StatPill icon={Truck} value={DELIVERY_TYPE_LABEL[order.deliveryType]} />
        </div>
      </div>
    </div>
  );
}

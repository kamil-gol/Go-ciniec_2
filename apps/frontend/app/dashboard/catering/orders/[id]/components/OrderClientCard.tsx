import {
  Building2,
  User,
  Mail,
  Phone,
  ChevronRight,
} from 'lucide-react';
import { SectionCard } from './SectionCard';
import { getInitials } from './types';
import type { CateringOrder } from './types';

interface OrderClientCardProps {
  order: CateringOrder;
  onViewProfile: () => void;
}

export function OrderClientCard({ order, onViewProfile }: OrderClientCardProps) {
  const isCompany = order.client.clientType === 'COMPANY';
  const initials = isCompany
    ? getInitials(null, null, order.client.companyName)
    : getInitials(order.client.firstName, order.client.lastName);

  const clientName =
    isCompany && order.client.companyName
      ? order.client.companyName
      : `${order.client.firstName ?? ''} ${order.client.lastName ?? ''}`.trim() || '—';

  return (
    <SectionCard
      icon={isCompany ? Building2 : User}
      iconBg={isCompany ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-indigo-100 dark:bg-indigo-900/30'}
      iconColor={isCompany ? 'text-violet-600 dark:text-violet-400' : 'text-indigo-600 dark:text-indigo-400'}
      title="Klient"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${isCompany ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-indigo-500 to-blue-600'}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{clientName}</p>
          {isCompany && (
            <span className="inline-flex items-center gap-1 text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full">
              <Building2 className="w-2.5 h-2.5" /> Firma
            </span>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {order.client.email && (
          <div className="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
            <Mail className="w-4 h-4 shrink-0 text-neutral-400" />
            <span className="truncate">{order.client.email}</span>
          </div>
        )}
        {order.client.phone && (
          <div className="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
            <Phone className="w-4 h-4 shrink-0 text-neutral-400" />
            <span>{order.client.phone}</span>
          </div>
        )}
      </div>
      {(order.contactName || order.contactPhone || order.contactEmail) && (
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">Kontakt do zamówienia</p>
          <div className="space-y-2">
            {order.contactName && (
              <div className="flex items-center gap-2.5 text-sm">
                <User className="w-4 h-4 shrink-0 text-neutral-400" />
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{order.contactName}</span>
              </div>
            )}
            {order.contactPhone && (
              <div className="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
                <Phone className="w-4 h-4 shrink-0 text-neutral-400" />
                <span>{order.contactPhone}</span>
              </div>
            )}
            {order.contactEmail && (
              <div className="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
                <Mail className="w-4 h-4 shrink-0 text-neutral-400" />
                <span className="truncate">{order.contactEmail}</span>
              </div>
            )}
          </div>
        </div>
      )}
      <button
        onClick={onViewProfile}
        className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
      >
        Profil klienta <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </SectionCard>
  );
}

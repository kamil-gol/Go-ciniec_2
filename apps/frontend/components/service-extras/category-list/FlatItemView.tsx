'use client';

import {
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  ServiceCategory,
  ServiceItem,
} from '@/types/service-extra.types';
import { PRICE_LABELS, PRICE_TYPE_STYLES, priceSuffix } from './category-list-config';

interface FlatItemViewProps {
  categories: ServiceCategory[];
  onEditItem: (item: ServiceItem) => void;
  onDeleteItem: (item: ServiceItem) => void;
}

export function FlatItemView({ categories, onEditItem, onDeleteItem }: FlatItemViewProps) {
  const allItems = categories.flatMap(
    (cat) => cat.items?.map((item) => ({ ...item, category: cat })) || []
  );

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-neutral-200/80 dark:divide-neutral-700/50">
        {allItems.map((item) => (
          <div key={item.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0">{item.icon || '📦'}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{item.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.category?.color || '#94a3b8' }}
                    />
                    {item.category?.name}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {item.priceType !== 'FREE' ? (
                  <p className="font-bold text-sm tabular-nums">
                    {Number(item.basePrice).toLocaleString('pl-PL')} zł{priceSuffix(item.priceType)}
                  </p>
                ) : (
                  <p className="text-sm text-emerald-600 font-medium">Gratis</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${PRICE_TYPE_STYLES[item.priceType] || ''}`}>
                  {PRICE_LABELS[item.priceType]}
                </span>
                {!item.isActive && <Badge variant="secondary" className="text-[10px]">Nieaktywna</Badge>}
              </div>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditItem(item)} aria-label="Edytuj pozycję">
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeleteItem(item)} aria-label="Usuń pozycję">
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50/50 dark:bg-neutral-800/50">
              <TableHead className="font-semibold text-purple-600 dark:text-purple-400">Pozycja</TableHead>
              <TableHead className="font-semibold text-purple-600 dark:text-purple-400">Kategoria</TableHead>
              <TableHead className="font-semibold text-purple-600 dark:text-purple-400">Typ ceny</TableHead>
              <TableHead className="font-semibold text-purple-600 dark:text-purple-400 text-right">Cena</TableHead>
              <TableHead className="font-semibold text-purple-600 dark:text-purple-400">Status</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allItems.map((item) => (
              <TableRow key={item.id} className="group hover:bg-purple-50/40 dark:hover:bg-purple-900/10 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon || '📦'}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-neutral-500 truncate max-w-[200px]">{item.description}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-neutral-900"
                      style={{ backgroundColor: item.category?.color || '#94a3b8' }}
                    />
                    <span className="text-sm">{item.category?.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${PRICE_TYPE_STYLES[item.priceType] || ''}`}>
                    {PRICE_LABELS[item.priceType]}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {item.priceType !== 'FREE' ? (
                    <span className="font-semibold tabular-nums text-sm">
                      {Number(item.basePrice).toLocaleString('pl-PL')} zł
                      {priceSuffix(item.priceType) && <span className="text-xs text-neutral-400 ml-0.5">{priceSuffix(item.priceType)}</span>}
                    </span>
                  ) : (
                    <span className="text-sm text-neutral-300 dark:text-neutral-600">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {item.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Aktywna
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                      Nieaktywna
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditItem(item)} aria-label="Edytuj pozycję">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDeleteItem(item)} aria-label="Usuń pozycję">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

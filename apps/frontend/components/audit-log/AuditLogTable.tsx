// apps/frontend/components/audit-log/AuditLogTable.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronDown, ChevronUp, Eye, Clock } from 'lucide-react';
import { Pagination } from '@/components/shared/Pagination';
import { AuditLogDetails } from './AuditLogDetails';
import { entityLabels } from './audit-log.constants';
import { groupLogEntries, isSystemAction, type LogGroup } from './audit-log.utils';
import { LogActionBadge } from './LogActionBadge';
import type { AuditLogEntry } from '@/types/audit-log.types';

interface Props {
  data: AuditLogEntry[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  total?: number;
  onPageChange: (page: number) => void;
}

export function AuditLogTable({
  data,
  page,
  totalPages,
  total,
  onPageChange,
}: Props) {
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [hideSystemActions, setHideSystemActions] = useState(false);

  // #217: Filter system actions if toggle is on
  const filteredData = useMemo(() => {
    if (!hideSystemActions) return data;
    return data.filter((log) => !isSystemAction(log.action));
  }, [data, hideSystemActions]);

  // #217: Group related entries
  const groups = useMemo(() => groupLogEntries(filteredData), [filteredData]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const systemCount = useMemo(() => data.filter((log) => isSystemAction(log.action)).length, [data]);

  return (
    <>
      {/* #217: System actions toggle */}
      {systemCount > 0 && (
        <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-2 border-b bg-muted/10">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideSystemActions}
              onChange={(e) => setHideSystemActions(e.target.checked)}
              className="rounded border-neutral-300 text-neutral-600 focus:ring-neutral-500 h-3.5 w-3.5"
            />
            Ukryj akcje systemowe ({systemCount})
          </label>
        </div>
      )}

      {/* ===== MOBILE CARD VIEW ===== */}
      <div className="md:hidden divide-y divide-neutral-200/80 dark:divide-neutral-700/50">
        {groups.map((group) => {
          const log = group.primary;
          const hasRelated = group.related.length > 0;
          const isExpanded = expandedGroups.has(log.id);

          return (
            <div key={log.id}>
              <div
                onClick={() => hasRelated ? toggleGroup(log.id) : setSelectedLog(log)}
                className="p-4 cursor-pointer hover:bg-muted/50 active:scale-[0.98] transition-all duration-150"
              >
                {/* Row 1: Date + Action Badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {format(new Date(log.createdAt), 'dd.MM.yyyy', { locale: pl })}
                    </span>
                    <span className="text-xs">
                      {format(new Date(log.createdAt), 'HH:mm', { locale: pl })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <LogActionBadge action={log.action} size="small" />
                    {hasRelated && (
                      <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                        +{group.related.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2: User + Entity Type */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {log.user?.firstName && log.user?.lastName
                      ? `${log.user.firstName} ${log.user.lastName}`
                      : 'System'}
                  </p>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                    {entityLabels[log.entityType] || log.entityType}
                  </span>
                </div>

                {/* Row 3: Description */}
                {(log.details?.description || log.details?.reason) && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                    {log.details?.description || log.details?.reason}
                  </p>
                )}
              </div>

              {/* Expanded related entries (mobile) */}
              {hasRelated && isExpanded && (
                <div className="pl-6 border-l-2 border-neutral-200 dark:border-neutral-700 ml-4 mb-2">
                  {group.related.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedLog(sub)}
                      className="py-2 px-3 cursor-pointer hover:bg-muted/30 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <LogActionBadge action={sub.action} size="small" />
                        <span className="text-muted-foreground">
                          {entityLabels[sub.entityType] || sub.entityType}
                        </span>
                      </div>
                      {sub.details?.description && (
                        <p className="text-muted-foreground mt-1 line-clamp-1">{sub.details.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ===== DESKTOP TABLE VIEW ===== */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[160px] font-semibold text-neutral-700 dark:text-neutral-300">Data</TableHead>
              <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300">Użytkownik</TableHead>
              <TableHead className="w-[150px] font-semibold text-neutral-700 dark:text-neutral-300">Akcja</TableHead>
              <TableHead className="w-[130px] font-semibold text-neutral-700 dark:text-neutral-300">Typ</TableHead>
              <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300">Opis</TableHead>
              <TableHead className="w-[70px] font-semibold text-neutral-700 dark:text-neutral-300"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => {
              const log = group.primary;
              const hasRelated = group.related.length > 0;
              const isExpanded = expandedGroups.has(log.id);

              return (
                <DesktopGroupRows
                  key={log.id}
                  group={group}
                  hasRelated={hasRelated}
                  isExpanded={isExpanded}
                  onToggle={() => toggleGroup(log.id)}
                  onSelect={setSelectedLog}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Paginacja */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={onPageChange}
        className="px-4 sm:px-6 py-4 border-t bg-muted/20"
      />

      {/* Modal szczegółów */}
      {selectedLog && (
        <AuditLogDetails
          log={selectedLog}
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </>
  );
}

// Desktop: Primary row + expandable related rows
function DesktopGroupRows({
  group,
  hasRelated,
  isExpanded,
  onToggle,
  onSelect,
}: {
  group: LogGroup;
  hasRelated: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: (log: AuditLogEntry) => void;
}) {
  const log = group.primary;

  return (
    <>
      <TableRow
        className="group cursor-pointer transition-colors hover:bg-muted/50"
        onClick={() => (hasRelated ? onToggle() : onSelect(log))}
      >
        <TableCell className="whitespace-nowrap">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {format(new Date(log.createdAt), 'dd.MM.yyyy', { locale: pl })}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(log.createdAt), 'HH:mm:ss', { locale: pl })}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {log.user?.firstName && log.user?.lastName
                ? `${log.user.firstName} ${log.user.lastName}`
                : 'System'}
            </p>
            <p className="text-xs text-muted-foreground">
              {log.user?.email || 'Akcja automatyczna'}
            </p>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <LogActionBadge action={log.action} />
            {hasRelated && (
              <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 font-medium">
                +{group.related.length}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {entityLabels[log.entityType] || log.entityType}
          </span>
        </TableCell>
        <TableCell className="max-w-md">
          <p className="truncate text-sm text-neutral-600 dark:text-neutral-400">
            {log.details?.description || log.details?.reason || '\u2014'}
          </p>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            {hasRelated ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                onClick={(e) => { e.stopPropagation(); onSelect(log); }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded related rows */}
      {hasRelated && isExpanded && group.related.map((sub) => (
        <TableRow
          key={sub.id}
          className="cursor-pointer hover:bg-muted/30 bg-muted/10"
          onClick={() => onSelect(sub)}
        >
          <TableCell className="pl-10 whitespace-nowrap">
            <p className="text-xs text-muted-foreground">
              {format(new Date(sub.createdAt), 'HH:mm:ss', { locale: pl })}
            </p>
          </TableCell>
          <TableCell>
            <p className="text-xs text-muted-foreground">
              {sub.user?.firstName && sub.user?.lastName
                ? `${sub.user.firstName} ${sub.user.lastName}`
                : 'System'}
            </p>
          </TableCell>
          <TableCell>
            <LogActionBadge action={sub.action} size="small" />
          </TableCell>
          <TableCell>
            <span className="text-xs text-muted-foreground">
              {entityLabels[sub.entityType] || sub.entityType}
            </span>
          </TableCell>
          <TableCell className="max-w-md">
            <p className="truncate text-xs text-muted-foreground">
              {sub.details?.description || sub.details?.reason || '\u2014'}
            </p>
          </TableCell>
          <TableCell>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
              onClick={(e) => { e.stopPropagation(); onSelect(sub); }}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

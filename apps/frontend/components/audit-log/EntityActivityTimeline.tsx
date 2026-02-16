// apps/frontend/components/audit-log/EntityActivityTimeline.tsx
// US-9.8: Reusable entity activity timeline component
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import {
  Plus, Edit, Trash2, RefreshCw, Archive, ArchiveRestore,
  LogIn, LogOut, ListPlus, ListMinus, ArrowLeftRight, ArrowUpDown,
  CreditCard, Paperclip, FileX, Clock, ChevronDown, ChevronUp,
  History, AlertCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useEntityActivityLog } from '@/lib/api/audit-log'
import type { AuditLogEntry } from '@/types/audit-log.types'

// ─── Polskie labele akcji (zsynchronizowane z AuditLogTable.tsx) ───
const actionLabels: Record<string, string> = {
  ARCHIVE: 'Archiwizacja',
  UNARCHIVE: 'Przywrócenie z archiwum',
  RESTORE: 'Przywrócenie',
  CREATE: 'Utworzenie',
  UPDATE: 'Aktualizacja',
  DELETE: 'Usunięcie',
  STATUS_CHANGE: 'Zmiana statusu',
  LOGIN: 'Logowanie',
  LOGOUT: 'Wylogowanie',
  QUEUE_ADD: 'Dodanie do kolejki',
  QUEUE_REMOVE: 'Usunięcie z kolejki',
  QUEUE_SWAP: 'Zamiana pozycji',
  QUEUE_MOVE: 'Przeniesienie',
  MARK_PAID: 'Oznaczenie płatności',
  ATTACHMENT_ADD: 'Dodanie załącznika',
  ATTACHMENT_DELETE: 'Usunięcie załącznika',
}

const actionColors: Record<string, string> = {
  ARCHIVE: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  UNARCHIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  RESTORE: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  CREATE: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  UPDATE: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  DELETE: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  STATUS_CHANGE: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
  LOGIN: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
  LOGOUT: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800',
  QUEUE_ADD: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
  QUEUE_REMOVE: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
  QUEUE_SWAP: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  QUEUE_MOVE: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  MARK_PAID: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  ATTACHMENT_ADD: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  ATTACHMENT_DELETE: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
}

// Polskie nazwy pól w szczegółach zmian
const fieldLabels: Record<string, string> = {
  status: 'Status',
  firstName: 'Imię',
  lastName: 'Nazwisko',
  email: 'Email',
  phone: 'Telefon',
  address: 'Adres',
  notes: 'Notatki',
  adults: 'Dorośli',
  children: 'Dzieci',
  toddlers: 'Maluszki',
  hallId: 'Sala',
  hallName: 'Nazwa sali',
  eventTypeId: 'Typ wydarzenia',
  eventTypeName: 'Nazwa wydarzenia',
  startDateTime: 'Data rozpoczęcia',
  endDateTime: 'Data zakończenia',
  date: 'Data',
  totalPrice: 'Cena całkowita',
  pricePerAdult: 'Cena za dorosłego',
  pricePerChild: 'Cena za dziecko',
  pricePerToddler: 'Cena za maluszka',
  discountType: 'Typ rabatu',
  discountValue: 'Wartość rabatu',
  discountAmount: 'Kwota rabatu',
  discountReason: 'Powód rabatu',
  priceBeforeDiscount: 'Cena przed rabatem',
  confirmationDeadline: 'Termin potwierdzenia',
  customEventType: 'Własny typ wydarzenia',
  birthdayAge: 'Wiek urodzinowy',
  anniversaryYear: 'Rok rocznicy',
  anniversaryOccasion: 'Okazja rocznicy',
  archivedAt: 'Data archiwizacji',
  archiveReason: 'Powód archiwizacji',
  name: 'Nazwa',
  capacity: 'Pojemność',
  description: 'Opis',
  amount: 'Kwota',
  paidAt: 'Data płatności',
  method: 'Metoda płatności',
}

function getActionIcon(action: string) {
  switch (action) {
    case 'CREATE': return <Plus className="w-4 h-4" />
    case 'UPDATE': return <Edit className="w-4 h-4" />
    case 'DELETE': return <Trash2 className="w-4 h-4" />
    case 'STATUS_CHANGE': return <RefreshCw className="w-4 h-4" />
    case 'ARCHIVE': return <Archive className="w-4 h-4" />
    case 'UNARCHIVE': case 'RESTORE': return <ArchiveRestore className="w-4 h-4" />
    case 'LOGIN': return <LogIn className="w-4 h-4" />
    case 'LOGOUT': return <LogOut className="w-4 h-4" />
    case 'QUEUE_ADD': return <ListPlus className="w-4 h-4" />
    case 'QUEUE_REMOVE': return <ListMinus className="w-4 h-4" />
    case 'QUEUE_SWAP': return <ArrowLeftRight className="w-4 h-4" />
    case 'QUEUE_MOVE': return <ArrowUpDown className="w-4 h-4" />
    case 'MARK_PAID': return <CreditCard className="w-4 h-4" />
    case 'ATTACHMENT_ADD': return <Paperclip className="w-4 h-4" />
    case 'ATTACHMENT_DELETE': return <FileX className="w-4 h-4" />
    default: return <AlertCircle className="w-4 h-4" />
  }
}

function getIconBgColor(action: string): string {
  switch (action) {
    case 'CREATE': return 'bg-blue-500'
    case 'UPDATE': return 'bg-amber-500'
    case 'DELETE': return 'bg-red-500'
    case 'STATUS_CHANGE': return 'bg-violet-500'
    case 'ARCHIVE': return 'bg-orange-500'
    case 'UNARCHIVE': case 'RESTORE': return 'bg-emerald-500'
    case 'MARK_PAID': return 'bg-green-500'
    case 'ATTACHMENT_ADD': return 'bg-cyan-500'
    case 'ATTACHMENT_DELETE': return 'bg-pink-500'
    case 'QUEUE_ADD': return 'bg-teal-500'
    case 'QUEUE_REMOVE': return 'bg-rose-500'
    case 'QUEUE_SWAP': return 'bg-purple-500'
    case 'QUEUE_MOVE': return 'bg-indigo-500'
    default: return 'bg-neutral-500'
  }
}

// ─── Renderer szczegółów zmian ───
function ChangeDetails({ details }: { details: AuditLogEntry['details'] }) {
  if (!details) return null

  const changes = details.changes
  if (!changes || Object.keys(changes).length === 0) return null

  return (
    <div className="mt-2 space-y-1.5">
      {Object.entries(changes).map(([field, value]) => {
        const label = fieldLabels[field] || field

        // Obiekt z wartościami old/new
        if (value && typeof value === 'object' && ('old' in value || 'new' in value)) {
          return (
            <div key={field} className="flex flex-col gap-0.5 text-xs">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">{label}:</span>
              <div className="flex items-center gap-2 pl-3">
                {value.old !== undefined && value.old !== null && (
                  <span className="text-red-600 dark:text-red-400 line-through">
                    {String(value.old)}
                  </span>
                )}
                {value.old !== undefined && value.new !== undefined && (
                  <span className="text-neutral-400">→</span>
                )}
                {value.new !== undefined && value.new !== null && (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {String(value.new)}
                  </span>
                )}
              </div>
            </div>
          )
        }

        // Prosta wartość
        return (
          <div key={field} className="text-xs">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">{label}:</span>{' '}
            <span className="text-neutral-600 dark:text-neutral-400">{String(value)}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Pojedynczy element timeline ───
function TimelineItem({ log, index, isLast }: { log: AuditLogEntry; index: number; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const hasDetails = log.details?.changes && Object.keys(log.details.changes).length > 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.5) }}
      className="flex gap-4"
    >
      {/* Linia timeline */}
      <div className="flex flex-col items-center">
        <div className={`p-2 rounded-full ${getIconBgColor(log.action)} text-white shadow-md`}>
          {getActionIcon(log.action)}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-neutral-200 dark:bg-neutral-700 mt-2 min-h-[24px]" />
        )}
      </div>

      {/* Treść */}
      <div className={`flex-1 ${!isLast ? 'pb-6' : 'pb-2'}`}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`text-xs font-medium ${actionColors[log.action] || 'bg-neutral-100 text-neutral-700'}`}
            >
              {actionLabels[log.action] || log.action}
            </Badge>
            {hasDetails && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Zwiń' : 'Szczegóły'}
              </button>
            )}
          </div>
          <time className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm', { locale: pl })}
          </time>
        </div>

        {/* Opis */}
        {log.details?.description && (
          <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            {log.details.description}
          </p>
        )}

        {/* Powód */}
        {log.details?.reason && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 italic mb-1">
            Powód: {log.details.reason}
          </p>
        )}

        {/* Użytkownik */}
        {log.user && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            przez {log.user.firstName} {log.user.lastName}
          </p>
        )}

        {/* Rozwijalne szczegóły zmian */}
        <AnimatePresence>
          {expanded && hasDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 border border-neutral-200/50 dark:border-neutral-700/30">
                <ChangeDetails details={log.details} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── Skeleton ładowania ───
function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
            {i < 3 && <div className="w-0.5 flex-1 bg-neutral-200 dark:bg-neutral-700 mt-2" />}
          </div>
          <div className="flex-1 pb-6 space-y-2">
            <div className="flex justify-between">
              <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-700 rounded" />
              <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded" />
            </div>
            <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div className="h-3 w-1/3 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Główny komponent ───
interface EntityActivityTimelineProps {
  entityType: string
  entityId: string
}

export function EntityActivityTimeline({ entityType, entityId }: EntityActivityTimelineProps) {
  const { data: logs, isLoading, isError } = useEntityActivityLog(entityType, entityId)

  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg">
              <History className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">Historia zmian</h2>
          </div>
          <TimelineSkeleton />
        </div>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="border-0 shadow-xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg">
              <History className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">Historia zmian</h2>
          </div>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <p className="text-neutral-600 dark:text-neutral-400">
              Nie udało się załadować historii zmian
            </p>
          </div>
        </div>
      </Card>
    )
  }

  if (!logs || logs.length === 0) {
    return (
      <Card className="border-0 shadow-xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg">
              <History className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">Historia zmian</h2>
          </div>
          <div className="text-center py-12">
            <History className="h-16 w-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-neutral-500 dark:text-neutral-400">
              Brak historii zmian
            </p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
              Zmiany dokonane na tym elemencie pojawią się tutaj
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg">
              <History className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Historia zmian</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {logs.length} {logs.length === 1 ? 'wpis' : logs.length < 5 ? 'wpisy' : 'wpisów'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-0">
          {logs.map((log, index) => (
            <TimelineItem
              key={log.id}
              log={log}
              index={index}
              isLast={index === logs.length - 1}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

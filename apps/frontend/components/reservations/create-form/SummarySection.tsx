'use client'

import { Controller } from 'react-hook-form'
import { DatePicker } from '@/components/ui/date-picker'
import { formatCurrency } from '@/lib/utils'
import {
  Sparkles, Building2, Users, User, DollarSign,
  FileText, AlertCircle, Tag, Package, ChevronRight,
} from 'lucide-react'
import type { SummarySectionProps } from './types'
import { ClipboardCheck } from 'lucide-react'

export function SummarySection({
  goToStep,
  selectedEventTypeName,
  isBirthday,
  isAnniversary,
  isCustom,
  watchAll,
  selectedHall,
  startDate,
  startTime,
  endTime,
  durationHours,
  extraHours,
  standardHours,
  venueSurcharge,
  venueSurchargeAmount,
  totalGuests,
  adults,
  children,
  toddlers,
  selectedClient,
  useMenuPackage,
  selectedTemplate,
  selectedPackage,
  discountEnabled,
  discountType,
  discountValue,
  discountReason,
  discountAmount,
  isDiscountValid,
  totalWithExtras,
  finalTotalPrice,
  selectedExtras,
  extrasTotal,
  formCtx,
  PriceSummary,
}: SummarySectionProps) {
  const { control, register, errors } = formCtx

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-teal-500 text-white mb-3">
          <ClipboardCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Sprawdź i utwórz</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Przejrzyj dane przed utworzeniem rezerwacji</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 transition-colors" onClick={() => goToStep(0)}>
          <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" /><span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase">Wydarzenie</span></div>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedEventTypeName || '—'}</p>
          {isBirthday && watchAll.birthdayAge && <p className="text-sm text-neutral-600 dark:text-neutral-400">{watchAll.birthdayAge}. urodziny</p>}
          {isAnniversary && watchAll.anniversaryYear && <p className="text-sm text-neutral-600 dark:text-neutral-400">{watchAll.anniversaryYear}. rocznica</p>}
          {isCustom && watchAll.customEventType && <p className="text-sm text-neutral-600 dark:text-neutral-400">{watchAll.customEventType}</p>}
        </div>

        <div className="p-4 rounded-xl border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors" onClick={() => goToStep(1)}>
          <div className="flex items-center gap-2 mb-2"><Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /><span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">Sala i termin</span></div>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedHall?.name || '—'}</p>
          {startDate && startTime && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {new Date(`${startDate}T${startTime}`).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {startTime}–{endTime || '?'}
            </p>
          )}
          {durationHours > 0 && (
            <p className={`text-xs ${durationHours > standardHours ? 'text-amber-700 dark:text-amber-300 font-medium' : 'text-neutral-500 dark:text-neutral-400'}`}>
              {durationHours}h{durationHours > standardHours && ` (w tym ${extraHours}h dodatkowych)`}
            </p>
          )}
          {venueSurchargeAmount > 0 && (
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1 mt-1">
              <Building2 className="w-3 h-3" />
              {venueSurcharge.label}: +{formatCurrency(venueSurchargeAmount)}
            </p>
          )}
        </div>

        <div className="p-4 rounded-xl border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 cursor-pointer hover:border-green-400 dark:hover:border-green-600 transition-colors" onClick={() => goToStep(2)}>
          <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-green-600 dark:text-green-400" /><span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">Goście</span></div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{totalGuests} osób</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{adults} dor. {children > 0 && `+ ${children} dzieci `}{toddlers > 0 && `+ ${toddlers} mal.`}</p>
        </div>

        <div className="p-4 rounded-xl border bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors" onClick={() => goToStep(4)}>
          <div className="flex items-center gap-2 mb-2">
            {(selectedClient as any)?.clientType === 'COMPANY' ? <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase">Klient</span>
            {(selectedClient as any)?.clientType === 'COMPANY' && <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-medium">Firma</span>}
          </div>
          {selectedClient ? (
            <div>
              {(selectedClient as any).clientType === 'COMPANY' && (selectedClient as any).companyName ? (
                <>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">{(selectedClient as any).companyName}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{selectedClient.firstName} {selectedClient.lastName}{(selectedClient as any).nip ? ` · NIP: ${(selectedClient as any).nip}` : ''}</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedClient.firstName} {selectedClient.lastName}</p>
                  <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                    {selectedClient.phone && <span>{selectedClient.phone}</span>
                    }
                    {selectedClient.email && <span>{selectedClient.email}</span>}
                  </div>
                </>
              )}
            </div>
          ) : <p className="text-neutral-500 dark:text-neutral-400">—</p>}
        </div>
      </div>

      <div className="cursor-pointer" onClick={() => goToStep(3)}>
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <span className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase">Podsumowanie finansowe</span>
          {useMenuPackage && selectedTemplate && selectedPackage && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
              • {selectedTemplate.name} <ChevronRight className="w-3 h-3" /> {selectedPackage.name}
            </span>
          )}
        </div>
        <PriceSummary compact />

        {discountEnabled && (
          <div className="mt-3">
            {isDiscountValid ? (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl space-y-1 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">Rabat</span>
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                    {discountType === 'PERCENTAGE' ? `${discountValue}%` : formatCurrency(discountValue)}
                  </span>
                </div>

                {discountReason.trim().length >= 3 && (
                  <p className="text-xs text-orange-600/70 dark:text-orange-400/70 italic">{discountReason}</p>
                )}

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Cena bazowa</span>
                    <span>{formatCurrency(totalWithExtras)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600 dark:text-orange-400 font-medium">
                    <span>Rabat</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-orange-200 dark:border-orange-800 pt-1">
                    <span className="text-neutral-900 dark:text-neutral-100">Po rabacie</span>
                    <span className="text-emerald-700 dark:text-emerald-400">{formatCurrency(finalTotalPrice)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span className="font-semibold text-amber-900 dark:text-amber-100">Rabat nie zostanie zastosowany</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">Uzupełnij wartość rabatu i powód (min. 3 znaki).</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Service extras compact view — Stage 3 */}
      {selectedExtras.length > 0 && (
        <div className="cursor-pointer" onClick={() => goToStep(3)}>
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase">Usługi dodatkowe</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              • {selectedExtras.length} {selectedExtras.length === 1 ? 'usługa' : selectedExtras.length < 5 ? 'usługi' : 'usług'}
            </span>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl space-y-1">
            {selectedExtras.map((extra) => (
              <div key={extra.serviceItem.id} className="flex justify-between text-sm">
                <span className="text-neutral-700 dark:text-neutral-300">
                  {extra.serviceItem.name} {extra.quantity > 1 ? `×${extra.quantity}` : ''}
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {extra.serviceItem.priceType === 'FREE'
                    ? 'Gratis'
                    : extra.serviceItem.priceType === 'PER_PERSON'
                      ? formatCurrency(extra.serviceItem.basePrice * totalGuests * extra.quantity)
                      : formatCurrency(extra.serviceItem.basePrice * extra.quantity)}
                </span>
              </div>
            ))}
            {extrasTotal > 0 && (
              <div className="flex justify-between text-sm font-semibold border-t border-rose-200 dark:border-rose-700 pt-1 mt-1">
                <span className="text-neutral-800 dark:text-neutral-200">Razem usługi dodatkowe</span>
                <span className="text-rose-600 dark:text-rose-400">+{formatCurrency(extrasTotal)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <Controller name="confirmationDeadline" control={control} render={({ field }) => (
          <DatePicker value={field.value || ''} onChange={field.onChange} label="Termin potwierdzenia (opcjonalnie)" placeholder="Wybierz datę..." error={errors.confirmationDeadline?.message} minDate={new Date()} />
        )} />
        <p className="-mt-2 text-xs text-neutral-500 dark:text-neutral-400">Musi być co najmniej 1 dzień przed rozpoczęciem wydarzenia</p>

        <div>
          <div className="flex items-center gap-2 mb-1"><FileText className="w-5 h-5 text-neutral-500 dark:text-neutral-400" /><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Notatki</label></div>
          <textarea className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-400 dark:hover:border-primary-600 transition-colors resize-none" rows={3} placeholder="Dodatkowe informacje..." {...register('notes')} />
        </div>
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Zaliczka</p>
          <p className="text-xs text-blue-700 dark:text-blue-300">Zaliczkę można dodać po utworzeniu rezerwacji, w widoku szczegółów rezerwacji (sekcja finansowa).</p>
        </div>
      </div>
    </div>
  )
}

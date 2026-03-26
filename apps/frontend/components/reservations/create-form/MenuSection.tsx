'use client'

import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import {
  UtensilsCrossed, DollarSign, AlertCircle,
  Sparkles, BookOpen, Package, ChevronRight,
} from 'lucide-react'
import { CreateReservationDiscountSection } from '@/components/reservations/CreateReservationDiscountSection'
import { CreateReservationExtrasSection } from '@/components/service-extras/CreateReservationExtrasSection'
import { selectAllOnFocus } from './utils'
import type { MenuSectionProps } from './types'

export function MenuSection({
  formCtx,
  useMenuPackage,
  selectedEventTypeId,
  menuTemplateId,
  menuPackageId,
  menuTemplatesArray,
  menuTemplatesLoading,
  templatePackagesArray,
  templatePackagesLoading,
  selectedTemplate,
  selectedPackage,
  hasNoTemplatesForEventType,
  pricePerAdult,
  childPriceManuallySet,
  setChildPriceManuallySet,
  toddlerPriceManuallySet,
  setToddlerPriceManuallySet,
  selectedExtras,
  onExtrasChange,
  totalGuests,
  totalWithExtras,
  PriceSummary,
}: MenuSectionProps) {
  const { control, register, errors, setValue } = formCtx

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white mb-3">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Menu i wycena</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Wybierz szablon menu i pakiet cenowy, lub ustaw ceny ręcznie</p>
      </div>

      {/* Toggle: use menu package */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800/50 dark:to-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">Gotowe menu</span>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Wybierz szablon i pakiet — ceny ustawią się automatycznie</p>
          </div>
        </div>
        <Controller name="useMenuPackage" control={control} render={({ field }) => (
          <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!selectedEventTypeId || !!hasNoTemplatesForEventType} />
        )} />
      </div>

      {hasNoTemplatesForEventType && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-200">Brak szablonów menu dla tego typu wydarzenia. Użyj ręcznego ustalania cen.</p>
        </div>
      )}

      {/* ═══ MENU FLOW: Szablon → Pakiet ═══ */}
      {useMenuPackage && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">

          {/* STEP A: Wybierz szablon menu */}
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">1</div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Szablon menu</span>
              </div>
            </div>

            <Controller name="menuTemplateId" control={control} render={({ field }) => (
              <Select value={field.value || ''} onValueChange={(val) => {
                field.onChange(val)
                setValue('menuPackageId', '')
              }}>
                <SelectTrigger className="h-11 bg-white dark:bg-neutral-900" aria-label="Wybierz szablon menu">
                  <SelectValue placeholder={menuTemplatesLoading ? 'Ładowanie szablonów...' : 'Wybierz szablon menu...'} />
                </SelectTrigger>
                <SelectContent>
                  {menuTemplatesArray.map((tmpl) => (
                    <SelectItem key={tmpl.id} value={tmpl.id}>
                      <div className="flex items-center gap-2">
                        <span>{tmpl.name}</span>
                        {tmpl.variant && <span className="text-xs text-muted-foreground">({tmpl.variant})</span>}
                        {tmpl._count?.packages != null && (
                          <span className="text-xs text-indigo-500 dark:text-indigo-400 ml-1">
                            {tmpl._count.packages} {tmpl._count.packages === 1 ? 'pakiet' : tmpl._count.packages < 5 ? 'pakiety' : 'pakietów'}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />

            {selectedTemplate && selectedTemplate.description && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-lg p-2">
                {selectedTemplate.description}
              </motion.p>
            )}
          </div>

          {/* STEP B: Wybierz pakiet (after template is chosen) */}
          {menuTemplateId && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">2</div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">Pakiet cenowy</span>
                </div>
              </div>

              {templatePackagesLoading ? (
                <div className="flex items-center gap-2 py-2">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Ładowanie pakietów...</span>
                </div>
              ) : templatePackagesArray.length === 0 ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">Brak pakietów w tym szablonie. Wybierz inny szablon lub ustaw ceny ręcznie.</p>
                </div>
              ) : (
                <Controller name="menuPackageId" control={control} render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 bg-white dark:bg-neutral-900" aria-label="Wybierz pakiet menu">
                      <SelectValue placeholder="Wybierz pakiet..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templatePackagesArray.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} — {formatCurrency(parseFloat(pkg.pricePerAdult))}/osoba
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              )}

              {/* Package details card */}
              {selectedPackage && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-white dark:bg-neutral-800 rounded-lg border border-emerald-300 dark:border-emerald-700">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedPackage.name}</h4>
                      {selectedPackage.shortDescription && <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{selectedPackage.shortDescription}</p>}
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-3">
                        <div className="text-center sm:text-left">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Dorosły</p>
                          <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(parseFloat(selectedPackage.pricePerAdult))}</p>
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Dziecko 4–12</p>
                          <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(parseFloat(selectedPackage.pricePerChild))}</p>
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Dziecko 0–3</p>
                          <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(parseFloat(selectedPackage.pricePerToddler))}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Breadcrumb indicator */}
          {useMenuPackage && (
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 px-1">
              <span className={menuTemplateId ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-neutral-400 dark:text-neutral-500'}>Szablon</span>
              <ChevronRight className="w-3 h-3" />
              <span className={menuPackageId ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-neutral-400 dark:text-neutral-500'}>Pakiet</span>
              <ChevronRight className="w-3 h-3" />
              <span className={selectedPackage ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-neutral-400 dark:text-neutral-500'}>Ceny</span>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ MANUAL PRICING ═══ */}
      {!useMenuPackage && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
              <Input type="number" label="Cena za dorosłego (PLN)" placeholder="0.00" error={errors.pricePerAdult?.message} onFocus={selectAllOnFocus} {...register('pricePerAdult')} />
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
              <Input type="number" label="Cena za dziecko 4–12 (PLN)" placeholder="0.00" error={errors.pricePerChild?.message} disabled={pricePerAdult === 0} onFocus={selectAllOnFocus} {...register('pricePerChild', { onChange: () => setChildPriceManuallySet(true) })} />
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
              <Input type="number" label="Cena za dziecko 0–3 (PLN)" placeholder="0.00" error={errors.pricePerToddler?.message} disabled={pricePerAdult === 0} onFocus={selectAllOnFocus} {...register('pricePerToddler', { onChange: () => setToddlerPriceManuallySet(true) })} />
            </div>
          </div>
          {pricePerAdult > 0 && !childPriceManuallySet && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">💡 Cena za dziecko ustawiona automatycznie na 50% ceny dorosłego. Cena za malucha na 25%. Możesz je zmienić ręcznie.</p>
          )}
        </motion.div>
      )}

      {/* #216: CategoryExtrasSelector removed — extras handled via DishSelector in edit flow */}

      <PriceSummary />

      <CreateReservationDiscountSection
        control={control}
        register={register}
        totalPrice={totalWithExtras}
      />

      {/* Service Extras — Sprint 8 */}
      <CreateReservationExtrasSection
        selectedExtras={selectedExtras}
        onExtrasChange={onExtrasChange}
        totalGuests={totalGuests}
      />
    </div>
  )
}

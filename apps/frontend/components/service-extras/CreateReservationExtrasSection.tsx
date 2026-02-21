'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useServiceCategories, useServiceItems } from '@/hooks/use-service-extras'
import type { ServiceItem } from '@/types/service-extra.types'
import { formatCurrency } from '@/lib/utils'
import {
  Package, Plus, Minus, MessageSquare, ChevronDown, ChevronUp,
  Sparkles, AlertCircle, Check,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// ═══ TYPES ═══

export interface SelectedExtra {
  serviceItemId: string
  serviceItem: ServiceItem
  quantity: number
  note: string
}

interface CreateReservationExtrasSectionProps {
  selectedExtras: SelectedExtra[]
  onExtrasChange: (extras: SelectedExtra[]) => void
  totalGuests: number
  compact?: boolean
}

// ═══ CATEGORY ICON MAP ═══

const CATEGORY_ICONS: Record&lt;string, string&gt; = {
  'muzyka': '🎵',
  'torty-slodkosci': '🎂',
  'dekoracje': '💐',
  'foto-video': '📷',
  'animacje-efekty': '🎉',
  'transport': '🚗',
  'inne': '📦',
}

// ═══ COMPONENT ═══

export function CreateReservationExtrasSection({
  selectedExtras,
  onExtrasChange,
  totalGuests,
  compact = false,
}: CreateReservationExtrasSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState&lt;Set&lt;string&gt;&gt;(new Set())
  const [editingNote, setEditingNote] = useState&lt;string | null&gt;(null)

  const { data: categories, isLoading: categoriesLoading } = useServiceCategories(true)
  const { data: items, isLoading: itemsLoading } = useServiceItems(true)

  const isLoading = categoriesLoading || itemsLoading

  const categoriesArray = useMemo(
    () => (Array.isArray(categories) ? categories : []).sort((a, b) => a.displayOrder - b.displayOrder),
    [categories]
  )

  const itemsArray = useMemo(
    () => (Array.isArray(items) ? items : []).sort((a, b) => a.displayOrder - b.displayOrder),
    [items]
  )

  const itemsByCategory = useMemo(() => {
    const map = new Map&lt;string, ServiceItem[]&gt;()
    for (const item of itemsArray) {
      const arr = map.get(item.categoryId) || []
      arr.push(item)
      map.set(item.categoryId, arr)
    }
    return map
  }, [itemsArray])

  const selectedMap = useMemo(() => {
    const map = new Map&lt;string, SelectedExtra&gt;()
    for (const extra of selectedExtras) {
      map.set(extra.serviceItemId, extra)
    }
    return map
  }, [selectedExtras])

  const extrasTotal = useMemo(() => {
    let total = 0
    for (const extra of selectedExtras) {
      const item = extra.serviceItem
      if (item.priceType === 'FREE') continue
      if (item.priceType === 'PER_PERSON') {
        total += item.basePrice * totalGuests * extra.quantity
      } else {
        total += item.basePrice * extra.quantity
      }
    }
    return total
  }, [selectedExtras, totalGuests])

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }, [])

  const toggleItem = useCallback((item: ServiceItem) => {
    if (selectedMap.has(item.id)) {
      onExtrasChange(selectedExtras.filter(e => e.serviceItemId !== item.id))
    } else {
      if (item.isExclusive) {
        const filtered = selectedExtras.filter(
          e => e.serviceItem.categoryId !== item.categoryId
        )
        onExtrasChange([
          ...filtered,
          { serviceItemId: item.id, serviceItem: item, quantity: 1, note: '' },
        ])
      } else {
        const filtered = selectedExtras.filter(
          e => !(e.serviceItem.categoryId === item.categoryId &amp;&amp; e.serviceItem.isExclusive)
        )
        onExtrasChange([
          ...filtered,
          { serviceItemId: item.id, serviceItem: item, quantity: 1, note: '' },
        ])
      }
    }
  }, [selectedExtras, selectedMap, onExtrasChange])

  const updateQuantity = useCallback((serviceItemId: string, delta: number) => {
    onExtrasChange(
      selectedExtras.map(e => {
        if (e.serviceItemId !== serviceItemId) return e
        const newQty = Math.max(1, e.quantity + delta)
        return { ...e, quantity: newQty }
      })
    )
  }, [selectedExtras, onExtrasChange])

  const updateNote = useCallback((serviceItemId: string, note: string) => {
    onExtrasChange(
      selectedExtras.map(e =>
        e.serviceItemId === serviceItemId ? { ...e, note } : e
      )
    )
  }, [selectedExtras, onExtrasChange])

  const getItemPrice = useCallback((item: ServiceItem, qty: number = 1): string => {
    if (item.priceType === 'FREE') return 'Gratis'
    if (item.priceType === 'PER_PERSON') {
      return `${formatCurrency(item.basePrice)}/os × ${totalGuests} = ${formatCurrency(item.basePrice * totalGuests * qty)}`
    }
    return qty > 1
      ? `${formatCurrency(item.basePrice)} × ${qty} = ${formatCurrency(item.basePrice * qty)}`
      : formatCurrency(item.basePrice)
  }, [totalGuests])

  // ═══ COMPACT VIEW (for summary step) ═══

  if (compact) {
    if (selectedExtras.length === 0) return null
    return (
      &lt;div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2"&gt;
        &lt;div className="flex items-center justify-between"&gt;
          &lt;div className="flex items-center gap-2"&gt;
            &lt;Package className="w-4 h-4 text-rose-600 dark:text-rose-400" /&gt;
            &lt;span className="font-semibold text-sm text-neutral-800 dark:text-neutral-200"&gt;
              Usługi dodatkowe ({selectedExtras.length})
            &lt;/span&gt;
          &lt;/div&gt;
          &lt;span className="font-bold text-rose-600 dark:text-rose-400"&gt;
            +{formatCurrency(extrasTotal)}
          &lt;/span&gt;
        &lt;/div&gt;
        &lt;div className="space-y-1"&gt;
          {selectedExtras.map(extra =&gt; (
            &lt;div key={extra.serviceItemId} className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400"&gt;
              &lt;span&gt;
                {CATEGORY_ICONS[extra.serviceItem.category?.slug || ''] || '📦'}{' '}
                {extra.serviceItem.name}
                {extra.quantity &gt; 1 &amp;&amp; ` ×${extra.quantity}`}
                {extra.note &amp;&amp; &lt;span className="text-neutral-400 dark:text-neutral-500 ml-1"&gt;— {extra.note}&lt;/span&gt;}
              &lt;/span&gt;
              &lt;span className="font-medium"&gt;{getItemPrice(extra.serviceItem, extra.quantity)}&lt;/span&gt;
            &lt;/div&gt;
          ))}
        &lt;/div&gt;
      &lt;/div&gt;
    )
  }

  // ═══ FULL VIEW ═══

  return (
    &lt;div className="space-y-3"&gt;
      {/* Toggle Header */}
      &lt;button
        type="button"
        onClick={() =&gt; setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl border border-rose-200 dark:border-rose-800 hover:border-rose-300 dark:hover:border-rose-700 transition-colors"
      &gt;
        &lt;div className="flex items-center gap-3"&gt;
          &lt;div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center"&gt;
            &lt;Package className="w-5 h-5 text-rose-600 dark:text-rose-400" /&gt;
          &lt;/div&gt;
          &lt;div className="text-left"&gt;
            &lt;span className="font-medium text-neutral-800 dark:text-neutral-200"&gt;Usługi dodatkowe&lt;/span&gt;
            &lt;p className="text-xs text-neutral-500 dark:text-neutral-400"&gt;
              {selectedExtras.length &gt; 0
                ? `Wybrano ${selectedExtras.length} — łącznie ${formatCurrency(extrasTotal)}`
                : 'Opcjonalnie: DJ, fotograf, torty, dekoracje...'}
            &lt;/p&gt;
          &lt;/div&gt;
        &lt;/div&gt;
        &lt;div className="flex items-center gap-2"&gt;
          {selectedExtras.length &gt; 0 &amp;&amp; (
            &lt;Badge variant="secondary" className="bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300"&gt;
              {selectedExtras.length}
            &lt;/Badge&gt;
          )}
          {isExpanded ? (
            &lt;ChevronUp className="w-5 h-5 text-neutral-400" /&gt;
          ) : (
            &lt;ChevronDown className="w-5 h-5 text-neutral-400" /&gt;
          )}
        &lt;/div&gt;
      &lt;/button&gt;

      {/* Expanded Content */}
      &lt;AnimatePresence&gt;
        {isExpanded &amp;&amp; (
          &lt;motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          &gt;
            {isLoading ? (
              &lt;div className="flex items-center justify-center py-8 gap-2"&gt;
                &lt;div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /&gt;
                &lt;span className="text-sm text-neutral-500"&gt;Ładowanie katalogu usług...&lt;/span&gt;
              &lt;/div&gt;
            ) : categoriesArray.length === 0 ? (
              &lt;div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2"&gt;
                &lt;AlertCircle className="w-5 h-5 text-amber-600" /&gt;
                &lt;p className="text-sm text-amber-800 dark:text-amber-200"&gt;
                  Brak dostępnych usług dodatkowych. Skonfiguruj katalog w Ustawienia → Usługi dodatkowe.
                &lt;/p&gt;
              &lt;/div&gt;
            ) : (
              &lt;div className="space-y-2"&gt;
                {categoriesArray.map(category =&gt; {
                  const categoryItems = itemsByCategory.get(category.id) || []
                  if (categoryItems.length === 0) return null

                  const isOpen = expandedCategories.has(category.id)
                  const selectedInCategory = categoryItems.filter(item =&gt; selectedMap.has(item.id))
                  const icon = CATEGORY_ICONS[category.slug] || '📦'

                  return (
                    &lt;div
                      key={category.id}
                      className={`rounded-xl border transition-colors ${
                        selectedInCategory.length &gt; 0
                          ? 'border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/10'
                          : 'border-neutral-200 dark:border-neutral-700'
                      }`}
                    &gt;
                      {/* Category header */}
                      &lt;button
                        type="button"
                        onClick={() =&gt; toggleCategory(category.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl transition-colors"
                      &gt;
                        &lt;div className="flex items-center gap-2"&gt;
                          &lt;span className="text-lg"&gt;{icon}&lt;/span&gt;
                          &lt;span className="font-medium text-sm text-neutral-800 dark:text-neutral-200"&gt;
                            {category.name}
                          &lt;/span&gt;
                          &lt;span className="text-xs text-neutral-400"&gt;
                            ({categoryItems.length})
                          &lt;/span&gt;
                          {selectedInCategory.length &gt; 0 &amp;&amp; (
                            &lt;Badge variant="secondary" className="text-xs bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400"&gt;
                              {selectedInCategory.length} wybr.
                            &lt;/Badge&gt;
                          )}
                        &lt;/div&gt;
                        {isOpen ? (
                          &lt;ChevronUp className="w-4 h-4 text-neutral-400" /&gt;
                        ) : (
                          &lt;ChevronDown className="w-4 h-4 text-neutral-400" /&gt;
                        )}
                      &lt;/button&gt;

                      {/* Items */}
                      &lt;AnimatePresence&gt;
                        {isOpen &amp;&amp; (
                          &lt;motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-3 pb-3 space-y-1.5"
                          &gt;
                            {categoryItems.map(item =&gt; {
                              const selected = selectedMap.get(item.id)
                              const isSelected = !!selected

                              return (
                                &lt;div
                                  key={item.id}
                                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'border-rose-300 dark:border-rose-700 bg-white dark:bg-neutral-800 shadow-sm'
                                      : 'border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/30'
                                  }`}
                                &gt;
                                  &lt;div
                                    className="flex items-center justify-between"
                                    onClick={() =&gt; toggleItem(item)}
                                  &gt;
                                    &lt;div className="flex items-center gap-3 min-w-0 flex-1"&gt;
                                      &lt;div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                        isSelected
                                          ? 'bg-rose-500 border-rose-500 text-white'
                                          : 'border-neutral-300 dark:border-neutral-600'
                                      }`}&gt;
                                        {isSelected &amp;&amp; &lt;Check className="w-3.5 h-3.5" /&gt;}
                                      &lt;/div&gt;
                                      &lt;div className="min-w-0"&gt;
                                        &lt;div className="flex items-center gap-2"&gt;
                                          &lt;span className="text-sm font-medium text-neutral-800 dark:text-neutral-200"&gt;
                                            {item.name}
                                          &lt;/span&gt;
                                          {item.isExclusive &amp;&amp; (
                                            &lt;Badge variant="outline" className="text-[10px] px-1.5 py-0"&gt;
                                              &lt;Sparkles className="w-2.5 h-2.5 mr-0.5" /&gt;
                                              Exclusive
                                            &lt;/Badge&gt;
                                          )}
                                          {item.requiresNote &amp;&amp; (
                                            &lt;MessageSquare className="w-3 h-3 text-neutral-400" /&gt;
                                          )}
                                        &lt;/div&gt;
                                        {item.description &amp;&amp; (
                                          &lt;p className="text-xs text-neutral-500 dark:text-neutral-400 truncate"&gt;
                                            {item.description}
                                          &lt;/p&gt;
                                        )}
                                      &lt;/div&gt;
                                    &lt;/div&gt;
                                    &lt;div className="text-right flex-shrink-0 ml-3"&gt;
                                      &lt;span className={`text-sm font-semibold ${
                                        item.priceType === 'FREE'
                                          ? 'text-green-600 dark:text-green-400'
                                          : 'text-neutral-800 dark:text-neutral-200'
                                      }`}&gt;
                                        {item.priceType === 'FREE'
                                          ? 'Gratis'
                                          : formatCurrency(item.basePrice)}
                                      &lt;/span&gt;
                                      {item.priceType === 'PER_PERSON' &amp;&amp; (
                                        &lt;p className="text-[10px] text-neutral-400"&gt;/os&lt;/p&gt;
                                      )}
                                    &lt;/div&gt;
                                  &lt;/div&gt;

                                  {/* Expanded controls when selected */}
                                  {isSelected &amp;&amp; selected &amp;&amp; (
                                    &lt;motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-700 space-y-2"
                                    &gt;
                                      &lt;div className="flex items-center justify-between"&gt;
                                        &lt;div className="flex items-center gap-2"&gt;
                                          &lt;span className="text-xs text-neutral-500"&gt;Ilość:&lt;/span&gt;
                                          &lt;div className="flex items-center gap-1"&gt;
                                            &lt;button
                                              type="button"
                                              onClick={(e) =&gt; { e.stopPropagation(); updateQuantity(item.id, -1) }}
                                              className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                                              disabled={selected.quantity &lt;= 1}
                                            &gt;
                                              &lt;Minus className="w-3 h-3" /&gt;
                                            &lt;/button&gt;
                                            &lt;span className="w-8 text-center text-sm font-semibold"&gt;
                                              {selected.quantity}
                                            &lt;/span&gt;
                                            &lt;button
                                              type="button"
                                              onClick={(e) =&gt; { e.stopPropagation(); updateQuantity(item.id, 1) }}
                                              className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                                            &gt;
                                              &lt;Plus className="w-3 h-3" /&gt;
                                            &lt;/button&gt;
                                          &lt;/div&gt;
                                        &lt;/div&gt;
                                        &lt;span className="text-xs font-medium text-rose-600 dark:text-rose-400"&gt;
                                          {getItemPrice(item, selected.quantity)}
                                        &lt;/span&gt;
                                      &lt;/div&gt;

                                      {/* Note field */}
                                      {(item.requiresNote || editingNote === item.id) &amp;&amp; (
                                        &lt;div className="flex items-center gap-2"&gt;
                                          &lt;MessageSquare className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" /&gt;
                                          &lt;input
                                            type="text"
                                            value={selected.note}
                                            onChange={(e) =&gt; updateNote(item.id, e.target.value)}
                                            onClick={(e) =&gt; e.stopPropagation()}
                                            placeholder={item.noteLabel || 'Dodaj notatkę...'}
                                            className="flex-1 text-xs px-2 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                                          /&gt;
                                        &lt;/div&gt;
                                      )}

                                      {!item.requiresNote &amp;&amp; editingNote !== item.id &amp;&amp; (
                                        &lt;button
                                          type="button"
                                          onClick={(e) =&gt; { e.stopPropagation(); setEditingNote(item.id) }}
                                          className="text-[10px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 flex items-center gap-1"
                                        &gt;
                                          &lt;MessageSquare className="w-3 h-3" /&gt;
                                          Dodaj notatkę
                                        &lt;/button&gt;
                                      )}
                                    &lt;/motion.div&gt;
                                  )}
                                &lt;/div&gt;
                              )
                            })}
                          &lt;/motion.div&gt;
                        )}
                      &lt;/AnimatePresence&gt;
                    &lt;/div&gt;
                  )
                })}

                {/* Summary bar */}
                {selectedExtras.length &gt; 0 &amp;&amp; (
                  &lt;motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between"
                  &gt;
                    &lt;div className="flex items-center gap-2"&gt;
                      &lt;Package className="w-4 h-4 text-rose-600 dark:text-rose-400" /&gt;
                      &lt;span className="text-sm font-medium text-neutral-800 dark:text-neutral-200"&gt;
                        {selectedExtras.length} {selectedExtras.length === 1 ? 'usługa' : selectedExtras.length &lt; 5 ? 'usługi' : 'usług'}
                      &lt;/span&gt;
                    &lt;/div&gt;
                    &lt;span className="text-lg font-bold text-rose-600 dark:text-rose-400"&gt;
                      +{formatCurrency(extrasTotal)}
                    &lt;/span&gt;
                  &lt;/motion.div&gt;
                )}
              &lt;/div&gt;
            )}
          &lt;/motion.div&gt;
        )}
      &lt;/AnimatePresence&gt;
    &lt;/div&gt;
  )
}

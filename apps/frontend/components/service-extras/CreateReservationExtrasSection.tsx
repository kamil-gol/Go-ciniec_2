'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { motionTokens } from '@/lib/design-tokens'
import { useServiceCategories, useServiceItems } from '@/hooks/use-service-extras'
import type { ServiceItem } from '@/types/service-extra.types'
import { formatCurrency } from '@/lib/utils'
import {
  Package, ChevronDown, ChevronUp,
  AlertCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_ICONS, getItemPrice, calculateExtrasTotal } from './create-extras/create-extras.config'
import { ServiceExtrasCategoryAccordion } from './create-extras/ServiceExtrasCategoryAccordion'

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

// ═══ COMPONENT ═══

export function CreateReservationExtrasSection({
  selectedExtras,
  onExtrasChange,
  totalGuests,
  compact = false,
}: CreateReservationExtrasSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [editingNote, setEditingNote] = useState<string | null>(null)

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
    const map = new Map<string, ServiceItem[]>()
    for (const item of itemsArray) {
      const arr = map.get(item.categoryId) || []
      arr.push(item)
      map.set(item.categoryId, arr)
    }
    return map
  }, [itemsArray])

  // Lookup: is a category exclusive?
  const exclusiveCategoryIds = useMemo(() => {
    const set = new Set<string>()
    for (const cat of categoriesArray) {
      if (cat.isExclusive) set.add(cat.id)
    }
    return set
  }, [categoriesArray])

  const selectedMap = useMemo(() => {
    const map = new Map<string, SelectedExtra>()
    for (const extra of selectedExtras) {
      map.set(extra.serviceItemId, extra)
    }
    return map
  }, [selectedExtras])

  const extrasTotal = useMemo(
    () => calculateExtrasTotal(selectedExtras, totalGuests),
    [selectedExtras, totalGuests]
  )

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
      // Deselect
      onExtrasChange(selectedExtras.filter(e => e.serviceItemId !== item.id))
    } else {
      // Select — check if category is exclusive
      const isCategoryExclusive = exclusiveCategoryIds.has(item.categoryId)

      if (isCategoryExclusive) {
        // Exclusive category: replace any existing item from this category
        const filtered = selectedExtras.filter(
          e => e.serviceItem.categoryId !== item.categoryId
        )
        onExtrasChange([
          ...filtered,
          { serviceItemId: item.id, serviceItem: item, quantity: 1, note: '' },
        ])
      } else {
        // Non-exclusive: just add
        onExtrasChange([
          ...selectedExtras,
          { serviceItemId: item.id, serviceItem: item, quantity: 1, note: '' },
        ])
      }
    }
  }, [selectedExtras, selectedMap, onExtrasChange, exclusiveCategoryIds])

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

  // ═══ COMPACT VIEW (for summary step) ═══

  if (compact) {
    if (selectedExtras.length === 0) return null
    return (
      <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">
              Usługi dodatkowe ({selectedExtras.length})
            </span>
          </div>
          <span className="font-bold text-rose-600 dark:text-rose-400">
            +{formatCurrency(extrasTotal)}
          </span>
        </div>
        <div className="space-y-1">
          {selectedExtras.map(extra => (
            <div key={extra.serviceItemId} className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
              <span>
                {CATEGORY_ICONS[extra.serviceItem.category?.slug || ''] || '📦'}{' '}
                {extra.serviceItem.name}
                {extra.quantity > 1 && ` ×${extra.quantity}${extra.serviceItem.priceType === 'PER_UNIT' ? ' szt.' : ''}`}
                {extra.note && <span className="text-neutral-500 dark:text-neutral-500 ml-1">— {extra.note}</span>}
              </span>
              <span className="font-medium">{getItemPrice(extra.serviceItem, totalGuests, extra.quantity)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ═══ FULL VIEW ═══

  return (
    <div className="space-y-3">
      {/* Toggle Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl border border-rose-200 dark:border-rose-800 hover:border-rose-300 dark:hover:border-rose-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <Package className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-left">
            <span className="font-medium text-neutral-800 dark:text-neutral-200">Usługi dodatkowe</span>
            <p className="text-xs text-neutral-500 dark:text-neutral-300">
              {selectedExtras.length > 0
                ? `Wybrano ${selectedExtras.length} — łącznie ${formatCurrency(extrasTotal)}`
                : 'Opcjonalnie: DJ, fotograf, torty, dekoracje...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedExtras.length > 0 && (
            <Badge variant="secondary" className="bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
              {selectedExtras.length}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-neutral-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neutral-500" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: motionTokens.duration.fast }}
            className="overflow-hidden"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8 gap-2">
                <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-neutral-500">Ładowanie katalogu usług...</span>
              </div>
            ) : categoriesArray.length === 0 ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Brak dostępnych usług dodatkowych. Skonfiguruj katalog w Ustawienia → Usługi dodatkowe.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {categoriesArray.map(category => {
                  const categoryItems = itemsByCategory.get(category.id) || []
                  if (categoryItems.length === 0) return null

                  return (
                    <ServiceExtrasCategoryAccordion
                      key={category.id}
                      category={category}
                      categoryItems={categoryItems}
                      isOpen={expandedCategories.has(category.id)}
                      onToggle={() => toggleCategory(category.id)}
                      selectedMap={selectedMap}
                      onToggleItem={toggleItem}
                      onUpdateQuantity={updateQuantity}
                      onUpdateNote={updateNote}
                      editingNote={editingNote}
                      onSetEditingNote={setEditingNote}
                      totalGuests={totalGuests}
                    />
                  )
                })}

                {/* Summary bar */}
                {selectedExtras.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {selectedExtras.length} {selectedExtras.length === 1 ? 'usługa' : selectedExtras.length < 5 ? 'usługi' : 'usług'}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                      +{formatCurrency(extrasTotal)}
                    </span>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

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

const CATEGORY_ICONS: { [key: string]: string } = {
  'muzyka': '\uD83C\uDFB5',
  'torty-slodkosci': '\uD83C\uDF82',
  'dekoracje': '\uD83D\uDC90',
  'foto-video': '\uD83D\uDCF7',
  'animacje-efekty': '\uD83C\uDF89',
  'transport': '\uD83D\uDE97',
  'inne': '\uD83D\uDCE6',
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

  const getItemPrice = useCallback((item: ServiceItem, qty: number = 1): string => {
    if (item.priceType === 'FREE') return 'Gratis'
    if (item.priceType === 'PER_PERSON') {
      return `${formatCurrency(item.basePrice)}/os \u00d7 ${totalGuests} = ${formatCurrency(item.basePrice * totalGuests * qty)}`
    }
    return qty > 1
      ? `${formatCurrency(item.basePrice)} \u00d7 ${qty} = ${formatCurrency(item.basePrice * qty)}`
      : formatCurrency(item.basePrice)
  }, [totalGuests])

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
            <div key={extra.serviceItemId} className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
              <span>
                {CATEGORY_ICONS[extra.serviceItem.category?.slug || ''] || '\uD83D\uDCE6'}{' '}
                {extra.serviceItem.name}
                {extra.quantity > 1 && ` \u00d7${extra.quantity}`}
                {extra.note && <span className="text-neutral-400 dark:text-neutral-500 ml-1">\u2014 {extra.note}</span>}
              </span>
              <span className="font-medium">{getItemPrice(extra.serviceItem, extra.quantity)}</span>
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
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {selectedExtras.length > 0
                ? `Wybrano ${selectedExtras.length} \u2014 łącznie ${formatCurrency(extrasTotal)}`
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
            <ChevronUp className="w-5 h-5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neutral-400" />
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
            transition={{ duration: 0.2 }}
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
                  Brak dostępnych usług dodatkowych. Skonfiguruj katalog w Ustawienia \u2192 Usługi dodatkowe.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {categoriesArray.map(category => {
                  const categoryItems = itemsByCategory.get(category.id) || []
                  if (categoryItems.length === 0) return null

                  const isOpen = expandedCategories.has(category.id)
                  const selectedInCategory = categoryItems.filter(item => selectedMap.has(item.id))
                  const icon = CATEGORY_ICONS[category.slug] || '\uD83D\uDCE6'
                  const isCategoryExclusive = category.isExclusive

                  return (
                    <div
                      key={category.id}
                      className={`rounded-xl border transition-colors ${
                        selectedInCategory.length > 0
                          ? 'border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/10'
                          : 'border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      {/* Category header */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{icon}</span>
                          <span className="font-medium text-sm text-neutral-800 dark:text-neutral-200">
                            {category.name}
                          </span>
                          <span className="text-xs text-neutral-400">
                            ({categoryItems.length})
                          </span>
                          {isCategoryExclusive && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                              Wyłączna
                            </Badge>
                          )}
                          {selectedInCategory.length > 0 && (
                            <Badge variant="secondary" className="text-xs bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
                              {selectedInCategory.length} wybr.
                            </Badge>
                          )}
                        </div>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-neutral-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-neutral-400" />
                        )}
                      </button>

                      {/* Items */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-3 pb-3 space-y-1.5"
                          >
                            {categoryItems.map(item => {
                              const selected = selectedMap.get(item.id)
                              const isSelected = !!selected

                              return (
                                <div
                                  key={item.id}
                                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'border-rose-300 dark:border-rose-700 bg-white dark:bg-neutral-800 shadow-sm'
                                      : 'border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/30'
                                  }`}
                                >
                                  <div
                                    className="flex items-center justify-between"
                                    onClick={() => toggleItem(item)}
                                  >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                        isSelected
                                          ? 'bg-rose-500 border-rose-500 text-white'
                                          : 'border-neutral-300 dark:border-neutral-600'
                                      }`}>
                                        {isSelected && <Check className="w-3.5 h-3.5" />}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                                            {item.name}
                                          </span>
                                          {item.requiresNote && (
                                            <MessageSquare className="w-3 h-3 text-neutral-400" />
                                          )}
                                        </div>
                                        {item.description && (
                                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                            {item.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-3">
                                      <span className={`text-sm font-semibold ${
                                        item.priceType === 'FREE'
                                          ? 'text-green-600 dark:text-green-400'
                                          : 'text-neutral-800 dark:text-neutral-200'
                                      }`}>
                                        {item.priceType === 'FREE'
                                          ? 'Gratis'
                                          : formatCurrency(item.basePrice)}
                                      </span>
                                      {item.priceType === 'PER_PERSON' && (
                                        <p className="text-[10px] text-neutral-400">/os</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Expanded controls when selected */}
                                  {isSelected && selected && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-700 space-y-2"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-neutral-500">Ilość:</span>
                                          <div className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1) }}
                                              className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                                              disabled={selected.quantity <= 1}
                                            >
                                              <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-8 text-center text-sm font-semibold">
                                              {selected.quantity}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1) }}
                                              className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                                            >
                                              <Plus className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                        <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                                          {getItemPrice(item, selected.quantity)}
                                        </span>
                                      </div>

                                      {/* Note field */}
                                      {(item.requiresNote || editingNote === item.id) && (
                                        <div className="flex items-center gap-2">
                                          <MessageSquare className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                                          <input
                                            type="text"
                                            value={selected.note}
                                            onChange={(e) => updateNote(item.id, e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            placeholder={item.noteLabel || 'Dodaj notatkę...'}
                                            className="flex-1 text-xs px-2 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                                          />
                                        </div>
                                      )}

                                      {!item.requiresNote && editingNote !== item.id && (
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); setEditingNote(item.id) }}
                                          className="text-[10px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 flex items-center gap-1"
                                        >
                                          <MessageSquare className="w-3 h-3" />
                                          Dodaj notatkę
                                        </button>
                                      )}
                                    </motion.div>
                                  )}
                                </div>
                              )
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
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

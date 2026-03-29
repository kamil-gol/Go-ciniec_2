'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { ServiceItem } from '@/types/service-extra.types'
import { formatCurrency } from '@/lib/utils'
import {
  Plus, Minus, MessageSquare, ChevronDown, ChevronUp,
  Sparkles, Check,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_ICONS, getItemPrice } from './create-extras.config'
import type { SelectedExtra } from '../CreateReservationExtrasSection'

interface ServiceExtrasCategoryAccordionProps {
  category: any
  categoryItems: ServiceItem[]
  isOpen: boolean
  onToggle: () => void
  selectedMap: Map<string, SelectedExtra>
  onToggleItem: (item: ServiceItem) => void
  onUpdateQuantity: (serviceItemId: string, delta: number) => void
  onUpdateNote: (serviceItemId: string, note: string) => void
  editingNote: string | null
  onSetEditingNote: (itemId: string | null) => void
  totalGuests: number
}

export function ServiceExtrasCategoryAccordion({
  category,
  categoryItems,
  isOpen,
  onToggle,
  selectedMap,
  onToggleItem,
  onUpdateQuantity,
  onUpdateNote,
  editingNote,
  onSetEditingNote,
  totalGuests,
}: ServiceExtrasCategoryAccordionProps) {
  const selectedInCategory = categoryItems.filter(item => selectedMap.has(item.id))
  const icon = CATEGORY_ICONS[category.slug] || '📦'
  const isCategoryExclusive = category.isExclusive

  return (
    <div
      className={`rounded-xl border transition-colors ${
        selectedInCategory.length > 0
          ? 'border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/10'
          : 'border-neutral-200 dark:border-neutral-700'
      }`}
    >
      {/* Category header */}
      <button
        type="button"
        onClick={onToggle}
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
                    onClick={() => onToggleItem(item)}
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
                          <p className="text-xs text-neutral-500 dark:text-neutral-300 truncate">
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
                      {item.priceType === 'PER_UNIT' && (
                        <p className="text-[10px] text-neutral-400">/szt.</p>
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
                          <span className="text-xs text-neutral-500">
                            {item.priceType === 'PER_UNIT' ? 'Ilość (szt.):' : 'Ilość:'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, -1) }}
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
                              onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, 1) }}
                              className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                          {getItemPrice(item, totalGuests, selected.quantity)}
                        </span>
                      </div>

                      {/* Note field */}
                      {(item.requiresNote || editingNote === item.id) && (
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                          <input
                            type="text"
                            value={selected.note}
                            onChange={(e) => onUpdateNote(item.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={item.noteLabel || 'Dodaj notatkę...'}
                            className="flex-1 text-xs px-2 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                          />
                        </div>
                      )}

                      {!item.requiresNote && editingNote !== item.id && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onSetEditingNote(item.id) }}
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
}

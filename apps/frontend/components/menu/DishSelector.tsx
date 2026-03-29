'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ChevronLeft, ChevronRight, Info, ShoppingCart
} from 'lucide-react'
import { usePackageCategories } from '@/hooks/use-menu'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

import { CategoryCard } from './dish-selector/CategoryCard'
import { isCategoryInactive, getGuestCountForTarget } from './dish-selector/helpers'
import type {
  CategorySelection,
  CategoryExtraResult,
  DishSelectorResult,
  DishSelectorProps,
} from './dish-selector/types'

// Re-export types for backwards compatibility
export type { CategoryExtraResult, DishSelectorResult } from './dish-selector/types'

export function DishSelector({
  packageId,
  adults,
  childrenCount,
  toddlers = 0,
  initialSelections,
  initialExtrasEnabled,
  onComplete,
  onBack
}: DishSelectorProps) {
  const { data: categoryData, isLoading } = usePackageCategories(packageId)
  const [selections, setSelections] = useState<Record<string, Record<string, number>>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isInitialized, setIsInitialized] = useState(false)
  // #216: Track which categories have extras toggle enabled
  const [extrasEnabled, setExtrasEnabled] = useState<Record<string, boolean>>(initialExtrasEnabled || {})
  // #216: Track inline warnings for extras toggle (must be before early returns)
  const [extrasWarning, setExtrasWarning] = useState<Record<string, string>>({})

  // #216: Total extras cost across all categories
  // MUST be before any early returns to satisfy Rules of Hooks
  const totalExtrasCost = useMemo(() => {
    const cats = categoryData?.categories
    if (!cats) return 0
    return cats.reduce((sum: number, cat: any) => {
      if (!extrasEnabled[cat.categoryId]) return sum
      const total = Object.values(selections[cat.categoryId] || {}).reduce((s: number, q: number) => s + q, 0)
      const baseMax = Number(cat.maxSelect)
      const extraQty = Math.max(0, total - baseMax)
      if (extraQty <= 0 || cat.extraItemPrice == null) return sum
      const price = Number(cat.extraItemPrice)
      const guestCount = getGuestCountForTarget(cat.portionTarget, adults, childrenCount, toddlers)
      return sum + Math.round(extraQty * price * guestCount * 100) / 100
    }, 0)
  }, [categoryData?.categories, selections, extrasEnabled, adults, childrenCount, toddlers])

  useEffect(() => {
    if (categoryData?.categories && !isInitialized) {
      const initialSelectionsData: Record<string, Record<string, number>> = {}

      categoryData.categories.forEach((cat: { categoryId: string; categoryName: string; portionTarget?: string; minSelect: number; maxSelect: number }) => {
        initialSelectionsData[cat.categoryId] = {}
      })

      if (initialSelections) {
        initialSelections.forEach(catSelection => {
          const dishes: Record<string, number> = {}
          catSelection.dishes.forEach(dish => {
            dishes[dish.dishId] = dish.quantity
          })
          initialSelectionsData[catSelection.categoryId] = dishes
        })
      }

      setSelections(initialSelectionsData)
      setIsInitialized(true)
    }
  }, [categoryData, initialSelections, isInitialized])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!categoryData?.categories || categoryData.categories.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Ten pakiet nie wymaga wyboru dań z kategorii.
        </AlertDescription>
      </Alert>
    )
  }

  const categories = categoryData.categories

  // #216: Get effective maxSelect for a category (base + maxExtra if extras enabled)
  const getEffectiveMaxSelect = (category: { categoryId: string; categoryName: string; portionTarget?: string; minSelect: number; maxSelect: number; dishes: { id: string; name: string }[] }): number => {
    const base = Number(category.maxSelect)
    if (extrasEnabled[category.categoryId] && category.extraItemPrice != null && category.maxExtra != null) {
      return base + Number(category.maxExtra)
    }
    return base
  }

  const getCategoryTotal = (categoryId: string): number => {
    const categorySelections = selections[categoryId] || {}
    return Object.values(categorySelections).reduce((sum, qty) => sum + qty, 0)
  }

  const getCategorySettings = (categoryId: string) => {
    return categories.find((cat: { categoryId: string; categoryName: string; portionTarget?: string; minSelect: number; maxSelect: number }) => cat.categoryId === categoryId)
  }

  const getCategoryRemaining = (categoryId: string): number => {
    const settings = getCategorySettings(categoryId)
    if (!settings) return 0
    return getEffectiveMaxSelect(settings) - getCategoryTotal(categoryId)
  }

  const getAvailableQuantityOptions = (categoryId: string, dishId: string): number[] => {
    const allOptions = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
    const currentDishQty = selections[categoryId]?.[dishId] || 0
    const maxForDish = getCategoryRemaining(categoryId) + currentDishQty
    return allOptions.filter(opt => opt <= maxForDish)
  }

  const toggleDish = (categoryId: string, dishId: string) => {
    const isCurrentlySelected = !!selections[categoryId]?.[dishId]

    if (!isCurrentlySelected) {
      const categorySettings = getCategorySettings(categoryId)
      const remaining = getCategoryRemaining(categoryId)
      const effectiveMax = getEffectiveMaxSelect(categorySettings)

      if (remaining <= 0) {
        toast.error(`Możesz wybrać maksymalnie ${effectiveMax} pozycji z kategorii "${categorySettings.customLabel || categorySettings.categoryName}". Odznacz inną pozycję aby dodać nową.`)
        return
      }

      const defaultQuantity = remaining < 1
        ? Math.round(remaining * 2) / 2
        : 1

      setSelections(prev => ({
        ...prev,
        [categoryId]: {
          ...prev[categoryId],
          [dishId]: defaultQuantity
        }
      }))
    } else {
      setSelections(prev => {
        const newSelections = { ...prev }
        const categorySelections = { ...newSelections[categoryId] }
        delete categorySelections[dishId]
        newSelections[categoryId] = categorySelections
        return newSelections
      })
    }

    // Clear errors and extras warnings when selections change
    if (errors[categoryId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[categoryId]
        return newErrors
      })
    }
    if (extrasWarning[categoryId]) {
      setExtrasWarning(prev => {
        const next = { ...prev }
        delete next[categoryId]
        return next
      })
    }
  }

  const updateQuantity = (categoryId: string, dishId: string, quantity: number) => {
    setSelections(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [dishId]: quantity
      }
    }))
    // Clear extras warning when quantity changes
    if (extrasWarning[categoryId]) {
      setExtrasWarning(prev => {
        const next = { ...prev }
        delete next[categoryId]
        return next
      })
    }
  }

  // #216: Toggle extras for a category
  const toggleExtras = (categoryId: string) => {
    const isCurrentlyOn = extrasEnabled[categoryId] || false

    // If turning OFF extras, check if selections exceed base maxSelect
    if (isCurrentlyOn) {
      const category = getCategorySettings(categoryId)
      if (category) {
        const baseMax = Number(category.maxSelect)
        const total = getCategoryTotal(categoryId)
        if (total > baseMax) {
          const excess = total - baseMax
          // Show inline warning — more visible than toast
          setExtrasWarning(prev => ({
            ...prev,
            [categoryId]: `Masz ${total} wybranych porcji — odznacz ${excess === Math.floor(excess) ? excess : excess.toFixed(1)} porcji (do limitu ${baseMax}), aby wyłączyć dodatkowe.`
          }))
          // Don't toggle off — force user to reduce selections first
          return
        }
      }
    }

    // Clear any warning for this category
    setExtrasWarning(prev => {
      const next = { ...prev }
      delete next[categoryId]
      return next
    })
    setExtrasEnabled(prev => ({ ...prev, [categoryId]: !prev[categoryId] }))
  }

  // #216: Calculate extra quantity for a category (portions beyond base maxSelect)
  const getExtraQuantity = (category: { categoryId: string; categoryName: string; portionTarget?: string; minSelect: number; maxSelect: number; dishes: { id: string; name: string }[] }): number => {
    if (!extrasEnabled[category.categoryId]) return 0
    const total = getCategoryTotal(category.categoryId)
    const baseMax = Number(category.maxSelect)
    return Math.max(0, total - baseMax)
  }

  // #216: Calculate extra cost for a single category (per-person)
  const getExtraCost = (category: { categoryId: string; categoryName: string; portionTarget?: string; minSelect: number; maxSelect: number; dishes: { id: string; name: string }[] }): number => {
    const extraQty = getExtraQuantity(category)
    if (extraQty <= 0 || category.extraItemPrice == null) return 0
    const price = Number(category.extraItemPrice)
    const guestCount = getGuestCountForTarget(category.portionTarget, adults, childrenCount, toddlers)
    return Math.round(extraQty * price * guestCount * 100) / 100
  }

  const validateSelections = (): { isValid: boolean; errorMap: Record<string, string> } => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    categories.forEach((category: { categoryId: string; categoryName: string; portionTarget?: string; minSelect: number; maxSelect: number; dishes: { id: string; name: string }[] }) => {
      // Skip validation for inactive categories
      if (isCategoryInactive(category.portionTarget, adults, childrenCount)) return;

      const total = getCategoryTotal(category.categoryId)
      const effectiveMax = getEffectiveMaxSelect(category)
      const label = category.customLabel || category.categoryName

      if (category.minSelect > 0 && total < category.minSelect) {
        newErrors[category.categoryId] = `\u201E${label}\u201D: wybierz minimum ${category.minSelect} pozycji (masz ${total})`
        isValid = false
      }

      if (total > effectiveMax) {
        newErrors[category.categoryId] = `\u201E${label}\u201D: maksymalnie ${effectiveMax} pozycji (masz ${total})`
        isValid = false
      }
    })

    setErrors(newErrors)
    return { isValid, errorMap: newErrors }
  }

  const handleComplete = () => {
    const { isValid, errorMap } = validateSelections()

    if (!isValid) {
      const errorMessages = Object.values(errorMap)
      toast.error(errorMessages.join('. ') + '.')
      return
    }

    // Exclude inactive categories from result
    const selectionsResult: CategorySelection[] = categories
      .filter((category: { categoryId: string; categoryName: string; portionTarget?: string; minSelect: number; maxSelect: number; dishes: { id: string; name: string }[] }) => !isCategoryInactive(category.portionTarget, adults, childrenCount))
      .map((category: { categoryId: string; categoryName: string; portionTarget?: string; minSelect: number; maxSelect: number; dishes: { id: string; name: string }[] }) => ({
        categoryId: category.categoryId,
        dishes: Object.entries(selections[category.categoryId] || {}).map(([dishId, quantity]) => ({
          dishId,
          quantity
        }))
      })).filter((cat: CategorySelection) => cat.dishes.length > 0)

    // #216: Build category extras from selections exceeding base maxSelect
    const categoryExtras: CategoryExtraResult[] = categories
      .filter((category: { categoryId: string; categoryName: string; portionTarget?: string; minSelect: number; maxSelect: number; dishes: { id: string; name: string }[] }) => {
        if (isCategoryInactive(category.portionTarget, adults, childrenCount)) return false
        if (!extrasEnabled[category.categoryId]) return false
        return getExtraQuantity(category) > 0
      })
      .map((category: { categoryId: string; categoryName: string; portionTarget?: string; minSelect: number; maxSelect: number; dishes: { id: string; name: string }[] }) => ({
        categoryId: category.categoryId,
        packageCategorySettingsId: category.id, // PackageCategorySettings.id
        extraQuantity: getExtraQuantity(category),
        pricePerItem: Number(category.extraItemPrice),
        portionTarget: category.portionTarget || 'ALL',
      }))

    onComplete({ selections: selectionsResult, categoryExtras })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">Wybór Dań</h2>
        <p className="text-sm text-muted-foreground">
          Wybierz dania z każdej kategorii zgodnie z limitami
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {categories.map((category: { categoryId: string; categoryName: string; portionTarget?: string; minSelect: number; maxSelect: number; dishes: { id: string; name: string }[] }) => (
          <CategoryCard
            key={category.categoryId}
            category={category}
            adults={adults}
            childrenCount={childrenCount}
            toddlers={toddlers}
            selections={selections[category.categoryId] || {}}
            errors={errors}
            extrasEnabled={extrasEnabled[category.categoryId] || false}
            extrasWarning={extrasWarning[category.categoryId]}
            getCategoryTotal={getCategoryTotal}
            getEffectiveMaxSelect={getEffectiveMaxSelect}
            getCategoryRemaining={getCategoryRemaining}
            getAvailableQuantityOptions={getAvailableQuantityOptions}
            getExtraQuantity={getExtraQuantity}
            getExtraCost={getExtraCost}
            onToggleDish={toggleDish}
            onUpdateQuantity={updateQuantity}
            onToggleExtras={toggleExtras}
          />
        ))}
      </div>

      {/* #216: Total extras cost summary */}
      {totalExtrasCost > 0 && (
        <div className="flex justify-between items-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">
              Dodatkowo płatne porcje:
            </span>
          </div>
          <span className="text-base font-bold text-orange-600 dark:text-orange-400">
            +{formatCurrency(totalExtrasCost)}
          </span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          size="default"
          onClick={onBack}
          className="border px-4"
        >
          <ChevronLeft className="mr-1.5 h-4 w-4" />
          Wstecz
        </Button>
        <Button
          onClick={handleComplete}
          size="default"
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-6 shadow-md font-bold"
        >
          Zatwierdź wybór
          <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

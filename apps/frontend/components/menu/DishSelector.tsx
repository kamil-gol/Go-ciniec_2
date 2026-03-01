'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { 
  ChevronLeft, ChevronRight, AlertCircle, Check, 
  Info, UtensilsCrossed, CheckCircle2, Lock,
  Users, User, Baby
} from 'lucide-react'
import { usePackageCategories } from '@/hooks/use-menu'
import type { PortionTarget } from '@/types/menu'
import { PORTION_TARGET_LABELS, PORTION_TARGET_ICONS } from '@/types/menu'

interface DishSelection {
  dishId: string
  quantity: number
}

interface CategorySelection {
  categoryId: string
  dishes: DishSelection[]
}

interface DishSelectorProps {
  packageId: string
  initialSelections?: CategorySelection[]
  onComplete: (selections: CategorySelection[]) => void
  onBack: () => void
}

/** #166: Portion target badge for category header */
function PortionTargetBadge({ target }: { target?: PortionTarget | string }) {
  if (!target || target === 'ALL') return null;
  
  const isAdults = target === 'ADULTS_ONLY';
  const Icon = isAdults ? User : Baby;
  const label = PORTION_TARGET_LABELS[target as PortionTarget] || target;
  
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
      isAdults
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
        : 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'
    }`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

export function DishSelector({ 
  packageId, 
  initialSelections,
  onComplete, 
  onBack 
}: DishSelectorProps) {
  const { toast } = useToast()
  const { data: categoryData, isLoading } = usePackageCategories(packageId)
  const [selections, setSelections] = useState<Record<string, Record<string, number>>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (categoryData?.categories && !isInitialized) {
      const initialSelectionsData: Record<string, Record<string, number>> = {}
      
      categoryData.categories.forEach((cat: any) => {
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
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
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

  const getCategoryTotal = (categoryId: string): number => {
    const categorySelections = selections[categoryId] || {}
    return Object.values(categorySelections).reduce((sum, qty) => sum + qty, 0)
  }

  const getCategorySettings = (categoryId: string) => {
    return categories.find((cat: any) => cat.categoryId === categoryId)
  }

  const getCategoryRemaining = (categoryId: string): number => {
    const settings = getCategorySettings(categoryId)
    if (!settings) return 0
    return settings.maxSelect - getCategoryTotal(categoryId)
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
      
      if (remaining <= 0) {
        toast({
          title: 'Limit osiągnięty',
          description: `Możesz wybrać maksymalnie ${categorySettings.maxSelect} pozycji z kategorii "${categorySettings.customLabel || categorySettings.categoryName}". Odznacz inną pozycję aby dodać nową.`,
          variant: 'destructive',
        })
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
    
    if (errors[categoryId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[categoryId]
        return newErrors
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
  }

  const validateSelections = (): { isValid: boolean; errorMap: Record<string, string> } => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    categories.forEach((category: any) => {
      const total = getCategoryTotal(category.categoryId)
      const label = category.customLabel || category.categoryName
      
      if (category.minSelect > 0 && total < category.minSelect) {
        newErrors[category.categoryId] = `\u201e${label}\u201d: wybierz minimum ${category.minSelect} pozycji (masz ${total})`
        isValid = false
      }
      
      if (total > category.maxSelect) {
        newErrors[category.categoryId] = `\u201e${label}\u201d: maksymalnie ${category.maxSelect} pozycji (masz ${total})`
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
      toast({
        title: 'Nie można zatwierdzić wyboru',
        description: errorMessages.join('. ') + '.',
        variant: 'destructive',
      })
      return
    }

    const result: CategorySelection[] = categories.map((category: any) => ({
      categoryId: category.categoryId,
      dishes: Object.entries(selections[category.categoryId] || {}).map(([dishId, quantity]) => ({
        dishId,
        quantity
      }))
    })).filter((cat: CategorySelection) => cat.dishes.length > 0)

    onComplete(result)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Wybór Dań</h2>
        <p className="text-muted-foreground">
          Wybierz dania z każdej kategorii zgodnie z limitami
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {categories.map((category: any) => {
          const total = getCategoryTotal(category.categoryId)
          const remaining = getCategoryRemaining(category.categoryId)
          const isOptional = category.minSelect === 0
          const isValid = total >= category.minSelect && total <= category.maxSelect
          const hasError = errors[category.categoryId]
          const isAtMaxLimit = total >= category.maxSelect
          const portionTarget = category.portionTarget as PortionTarget | undefined

          return (
            <Card key={category.categoryId} className="border-2 shadow-lg">
              <CardContent className="p-6">
                {/* Category Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{category.categoryIcon}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-2xl font-bold">{category.customLabel || category.categoryName}</h3>
                          {/* #166: Portion target badge */}
                          <PortionTargetBadge target={portionTarget} />
                        </div>
                        {/* #166: Subtitle for non-ALL targets */}
                        {portionTarget && portionTarget !== 'ALL' && (
                          <span className="text-xs text-muted-foreground">
                            Porcje liczone {portionTarget === 'ADULTS_ONLY' ? 'tylko dla dorosłych' : 'tylko dla dzieci'}
                          </span>
                        )}
                        {isOptional && !portionTarget?.startsWith('ADULTS') && !portionTarget?.startsWith('CHILDREN') && (
                          <span className="text-xs font-medium text-muted-foreground">Opcjonalna kategoria</span>
                        )}
                        {isOptional && portionTarget && portionTarget !== 'ALL' && (
                          <span className="text-xs font-medium text-muted-foreground"> · Opcjonalna</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isAtMaxLimit && total > 0 && (
                        <span className="text-sm text-muted-foreground">
                          Pozostało: {remaining}
                        </span>
                      )}
                      <Badge 
                        variant={isValid ? "default" : "secondary"}
                        className={`text-lg px-4 py-2 ${
                          isValid 
                            ? isOptional && total === 0
                              ? 'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {total} / {isOptional ? `0-${category.maxSelect}` : `${category.minSelect}-${category.maxSelect}`}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        !isOptional && total < category.minSelect ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                        total > category.maxSelect ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                        total === 0 ? '' :
                        'bg-gradient-to-r from-green-500 to-emerald-500'
                      }`}
                      style={{ 
                        width: `${Math.min((total / category.maxSelect) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  
                  {isAtMaxLimit && (
                    <Alert className="mt-3 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-900 dark:text-blue-100">
                        Osiągnięto maksymalną liczbę pozycji. Odznacz danie aby wybrać inne.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {hasError && (
                    <Alert variant="destructive" className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{hasError}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Dishes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.dishes.map((dish: any) => {
                    const isSelected = !!selections[category.categoryId]?.[dish.id]
                    const quantity = selections[category.categoryId]?.[dish.id] || 1
                    const isDisabled = !isSelected && isAtMaxLimit
                    const availableOptions = getAvailableQuantityOptions(category.categoryId, dish.id)

                    return (
                      <div
                        key={dish.id}
                        className={`relative p-5 border-3 rounded-xl transition-all duration-200 ${
                          isDisabled
                            ? 'opacity-50 cursor-not-allowed border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900'
                            : isSelected 
                              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 shadow-lg scale-[1.02] cursor-pointer' 
                              : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 hover:border-blue-300 hover:shadow-md hover:scale-[1.01] cursor-pointer'
                        }`}
                        onClick={() => !isDisabled && toggleDish(category.categoryId, dish.id)}
                      >
                        {isDisabled && (
                          <div className="absolute top-3 right-3 w-7 h-7 bg-neutral-400 rounded-full flex items-center justify-center">
                            <Lock className="h-4 w-4 text-white" />
                          </div>
                        )}

                        {isSelected && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                            <Check className="h-5 w-5 text-white font-bold" strokeWidth={3} />
                          </div>
                        )}

                        <div className="flex items-start gap-4">
                          <div className={`flex-shrink-0 mt-1 w-7 h-7 rounded-lg border-3 flex items-center justify-center transition-all duration-200 ${
                            isDisabled
                              ? 'bg-neutral-300 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600'
                              : isSelected
                                ? 'bg-gradient-to-br from-blue-500 to-cyan-500 border-blue-500 shadow-md'
                                : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 group-hover:border-blue-400'
                          }`}>
                            {isSelected && (
                              <CheckCircle2 className="h-5 w-5 text-white" strokeWidth={3} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className={`font-bold text-base mb-1 ${
                              isDisabled
                                ? 'text-neutral-400 dark:text-neutral-600'
                                : isSelected 
                                  ? 'text-blue-900 dark:text-blue-100' 
                                  : 'text-neutral-900 dark:text-neutral-100'
                            }`}>
                              {dish.name}
                            </h4>
                            {dish.description && (
                              <p className={`text-sm mt-1 line-clamp-2 ${
                                isDisabled ? 'text-neutral-400' : 'text-muted-foreground'
                              }`}>
                                {dish.description}
                              </p>
                            )}
                            
                            {dish.allergens && dish.allergens.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {dish.allergens.map((allergen: string) => (
                                  <Badge 
                                    key={allergen} 
                                    variant="outline" 
                                    className="text-xs border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-400"
                                  >
                                    {allergen}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {isSelected && (
                              <div className="mt-4 p-3 bg-white dark:bg-neutral-800 rounded-lg border-2 border-blue-200 dark:border-blue-800" onClick={(e) => e.stopPropagation()}>
                                <label className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 block">
                                  Ilość porcji:
                                </label>
                                <select
                                  value={quantity}
                                  onChange={(e) => updateQuantity(
                                    category.categoryId, 
                                    dish.id, 
                                    parseFloat(e.target.value)
                                  )}
                                  className="w-full px-4 py-2.5 border-2 border-blue-300 dark:border-blue-700 rounded-lg text-base font-bold bg-white dark:bg-neutral-900 text-blue-900 dark:text-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                                >
                                  {availableOptions.map(opt => (
                                    <option key={opt} value={opt}>
                                      {opt === Math.floor(opt) ? opt : opt.toFixed(1)} {opt === 1 ? 'porcja' : opt > 1 && opt < 5 ? 'porcje' : 'porcji'}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t-2">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          className="border-2 px-6"
        >
          <ChevronLeft className="mr-2 h-5 w-5" />
          Wstecz
        </Button>
        <Button
          onClick={handleComplete}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8 shadow-lg text-lg font-bold"
        >
          Zatwierdź wybór
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

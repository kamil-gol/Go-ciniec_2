'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ChevronLeft, ChevronRight, AlertCircle, Check, 
  Info, UtensilsCrossed, CheckCircle2
} from 'lucide-react'
import { usePackageCategories } from '@/hooks/use-menu'

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

export function DishSelector({ 
  packageId, 
  initialSelections,
  onComplete, 
  onBack 
}: DishSelectorProps) {
  const { data: categoryData, isLoading } = usePackageCategories(packageId)
  const [selections, setSelections] = useState<Record<string, Record<string, number>>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize selections state from categoryData or initialSelections
  useEffect(() => {
    if (categoryData?.categories && !isInitialized) {
      const initialSelectionsData: Record<string, Record<string, number>> = {}
      
      categoryData.categories.forEach((cat: any) => {
        initialSelectionsData[cat.categoryId] = {}
      })

      // If we have initialSelections, populate them
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

  // Toggle dish selection
  const toggleDish = (categoryId: string, dishId: string) => {
    setSelections(prev => {
      const newSelections = { ...prev }
      const categorySelections = { ...newSelections[categoryId] }
      
      if (categorySelections[dishId]) {
        // Remove dish
        delete categorySelections[dishId]
      } else {
        // Add dish with quantity 1
        categorySelections[dishId] = 1
      }
      
      newSelections[categoryId] = categorySelections
      return newSelections
    })
    
    // Clear error for this category
    if (errors[categoryId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[categoryId]
        return newErrors
      })
    }
  }

  // Update dish quantity
  const updateQuantity = (categoryId: string, dishId: string, quantity: number) => {
    setSelections(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [dishId]: quantity
      }
    }))
  }

  // Calculate total quantity for category
  const getCategoryTotal = (categoryId: string): number => {
    const categorySelections = selections[categoryId] || {}
    return Object.values(categorySelections).reduce((sum, qty) => sum + qty, 0)
  }

  // Validate selections
  const validateSelections = (): boolean => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    categories.forEach((category: any) => {
      const total = getCategoryTotal(category.categoryId)
      
      if (category.isRequired) {
        if (total < category.minSelect) {
          newErrors[category.categoryId] = `Wybierz minimum ${category.minSelect} pozycji`
          isValid = false
        } else if (total > category.maxSelect) {
          newErrors[category.categoryId] = `Wybierz maksymalnie ${category.maxSelect} pozycji`
          isValid = false
        }
      }
    })

    setErrors(newErrors)
    return isValid
  }

  // Handle completion
  const handleComplete = () => {
    if (!validateSelections()) {
      return
    }

    // Transform selections to output format
    const result: CategorySelection[] = categories.map((category: any) => ({
      categoryId: category.categoryId,
      dishes: Object.entries(selections[category.categoryId] || {}).map(([dishId, quantity]) => ({
        dishId,
        quantity
      }))
    })).filter((cat: CategorySelection) => cat.dishes.length > 0)

    onComplete(result)
  }

  // Generate quantity options (0.5 increments)
  const quantityOptions = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

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
          const isValid = total >= category.minSelect && total <= category.maxSelect
          const hasError = errors[category.categoryId]

          return (
            <Card key={category.categoryId} className="border-2 shadow-lg">
              <CardContent className="p-6">
                {/* Category Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{category.categoryIcon}</span>
                      <h3 className="text-2xl font-bold">{category.customLabel || category.categoryName}</h3>
                    </div>
                    <Badge 
                      variant={isValid ? "default" : "secondary"}
                      className={`text-lg px-4 py-2 ${
                        isValid 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}
                    >
                      {total} / {category.minSelect}-{category.maxSelect}
                    </Badge>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        total < category.minSelect ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                        total > category.maxSelect ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                        'bg-gradient-to-r from-green-500 to-emerald-500'
                      }`}
                      style={{ 
                        width: `${Math.min((total / category.maxSelect) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  
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

                    return (
                      <div
                        key={dish.id}
                        className={`relative p-5 border-3 rounded-xl transition-all duration-200 cursor-pointer group ${
                          isSelected 
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 shadow-lg scale-[1.02]' 
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:border-blue-300 hover:shadow-md hover:scale-[1.01]'
                        }`}
                        onClick={() => toggleDish(category.categoryId, dish.id)}
                      >
                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                            <Check className="h-5 w-5 text-white font-bold" strokeWidth={3} />
                          </div>
                        )}

                        <div className="flex items-start gap-4">
                          {/* Custom Checkbox */}
                          <div className={`flex-shrink-0 mt-1 w-7 h-7 rounded-lg border-3 flex items-center justify-center transition-all duration-200 ${
                            isSelected
                              ? 'bg-gradient-to-br from-blue-500 to-cyan-500 border-blue-500 shadow-md'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 group-hover:border-blue-400'
                          }`}>
                            {isSelected && (
                              <CheckCircle2 className="h-5 w-5 text-white" strokeWidth={3} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className={`font-bold text-base mb-1 ${
                              isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                            }`}>
                              {dish.name}
                            </h4>
                            {dish.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {dish.description}
                              </p>
                            )}
                            
                            {/* Allergens */}
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

                            {/* Quantity Selector */}
                            {isSelected && (
                              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-200 dark:border-blue-800" onClick={(e) => e.stopPropagation()}>
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
                                  className="w-full px-4 py-2.5 border-2 border-blue-300 dark:border-blue-700 rounded-lg text-base font-bold bg-white dark:bg-gray-900 text-blue-900 dark:text-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                                >
                                  {quantityOptions.map(opt => (
                                    <option key={opt} value={opt}>
                                      {opt === Math.floor(opt) ? opt : opt.toFixed(1)} {opt === 1 ? 'porcja' : 'porcji'}
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

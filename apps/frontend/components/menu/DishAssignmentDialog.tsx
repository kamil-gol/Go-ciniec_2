'use client'

import { useState, useEffect } from 'react'
import { useDishes } from '@/hooks/use-dishes'
import { useAssignDishes, useCourse } from '@/hooks/use-menu-courses'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, UtensilsCrossed, Check } from 'lucide-react'

interface DishAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
}

const DISH_CATEGORIES = [
  { value: 'all', label: 'Wszystkie kategorie' },
  { value: 'APPETIZER', label: 'Przystawka' },
  { value: 'SOUP', label: 'Zupa' },
  { value: 'MAIN_COURSE', label: 'Danie główne' },
  { value: 'SIDE_DISH', label: 'Dodatek' },
  { value: 'SALAD', label: 'Sałatka' },
  { value: 'DESSERT', label: 'Deser' },
  { value: 'DRINK', label: 'Napój' },
]

const CATEGORY_LABELS: Record<string, string> = {
  APPETIZER: 'Przystawka',
  SOUP: 'Zupa',
  MAIN_COURSE: 'Danie główne',
  SIDE_DISH: 'Dodatek',
  SALAD: 'Sałatka',
  DESSERT: 'Deser',
  DRINK: 'Napój',
}

interface DishSelection {
  dishId: string
  customPrice?: number
  isDefault: boolean
  isRecommended: boolean
}

export function DishAssignmentDialog({
  open,
  onOpenChange,
  courseId,
}: DishAssignmentDialogProps) {
  const [category, setCategory] = useState('all')
  const [selectedDishes, setSelectedDishes] = useState<Map<string, DishSelection>>(new Map())

  const { data: course } = useCourse(courseId)
  const { data: allDishes, isLoading: loadingDishes } = useDishes({
    category: category !== 'all' ? category : undefined,
    isActive: true,
  })
  const assignMutation = useAssignDishes()

  // Load currently assigned dishes
  useEffect(() => {
    if (course?.options) {
      const selections = new Map<string, DishSelection>()
      course.options.forEach((option) => {
        selections.set(option.dishId, {
          dishId: option.dishId,
          customPrice: option.customPrice || undefined,
          isDefault: option.isDefault,
          isRecommended: option.isRecommended,
        })
      })
      setSelectedDishes(selections)
    }
  }, [course])

  const handleToggleDish = (dishId: string) => {
    const newSelections = new Map(selectedDishes)
    if (newSelections.has(dishId)) {
      newSelections.delete(dishId)
    } else {
      newSelections.set(dishId, {
        dishId,
        isDefault: false,
        isRecommended: false,
      })
    }
    setSelectedDishes(newSelections)
  }

  const handleUpdateSelection = (dishId: string, updates: Partial<DishSelection>) => {
    const newSelections = new Map(selectedDishes)
    const current = newSelections.get(dishId)
    if (current) {
      newSelections.set(dishId, { ...current, ...updates })
      setSelectedDishes(newSelections)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const dishes = Array.from(selectedDishes.values()).map((sel, index) => ({
      dishId: sel.dishId,
      customPrice: sel.customPrice,
      isDefault: sel.isDefault,
      isRecommended: sel.isRecommended,
      displayOrder: index,
    }))

    try {
      await assignMutation.mutateAsync({
        courseId,
        input: { dishes },
      })
      onOpenChange(false)
    } catch (error: any) {
      console.error('Failed to assign dishes:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <UtensilsCrossed className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Przypisz Dania</DialogTitle>
                <DialogDescription>
                  Wybierz dania dla kursu: <strong>{course?.name}</strong>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Category Filter */}
            <div className="space-y-2">
              <Label>Filtruj po kategorii</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISH_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary */}
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">
                Wybrano: <span className="text-primary">{selectedDishes.size}</span> dań
              </p>
            </div>

            {/* Dishes List */}
            <ScrollArea className="h-[400px] pr-4">
              {loadingDishes && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {!loadingDishes && allDishes && allDishes.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Brak dostępnych dań</p>
                </div>
              )}

              {!loadingDishes && allDishes && allDishes.length > 0 && (
                <div className="space-y-3">
                  {allDishes.map((dish) => {
                    const isSelected = selectedDishes.has(dish.id)
                    const selection = selectedDishes.get(dish.id)

                    return (
                      <div
                        key={dish.id}
                        className={`border rounded-lg p-4 transition-all ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleDish(dish.id)}
                            className="mt-1"
                          />

                          {/* Dish Info */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{dish.name}</h4>
                                <Badge variant="outline" className="mt-1">
                                  {CATEGORY_LABELS[dish.category]}
                                </Badge>
                              </div>
                              {isSelected && (
                                <Check className="h-5 w-5 text-primary" />
                              )}
                            </div>

                            {dish.description && (
                              <p className="text-sm text-muted-foreground">
                                {dish.description}
                              </p>
                            )}

                            {/* Selection Options */}
                            {isSelected && selection && (
                              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                                <div>
                                  <Label htmlFor={`price-${dish.id}`} className="text-xs">
                                    Cena custom
                                  </Label>
                                  <Input
                                    id={`price-${dish.id}`}
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={selection.customPrice || ''}
                                    onChange={(e) =>
                                      handleUpdateSelection(dish.id, {
                                        customPrice: e.target.value
                                          ? parseFloat(e.target.value)
                                          : undefined,
                                      })
                                    }
                                    className="h-8"
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`default-${dish.id}`}
                                    checked={selection.isDefault}
                                    onCheckedChange={(checked) =>
                                      handleUpdateSelection(dish.id, {
                                        isDefault: checked as boolean,
                                      })
                                    }
                                  />
                                  <Label
                                    htmlFor={`default-${dish.id}`}
                                    className="text-xs cursor-pointer"
                                  >
                                    Domyślne
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`recommended-${dish.id}`}
                                    checked={selection.isRecommended}
                                    onCheckedChange={(checked) =>
                                      handleUpdateSelection(dish.id, {
                                        isRecommended: checked as boolean,
                                      })
                                    }
                                  />
                                  <Label
                                    htmlFor={`recommended-${dish.id}`}
                                    className="text-xs cursor-pointer"
                                  >
                                    Polecane
                                  </Label>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assignMutation.isPending}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={assignMutation.isPending || selectedDishes.size === 0}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                `Przypisz (${selectedDishes.size})`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

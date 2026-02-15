'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Loader2, ChefHat, X, CheckCircle2, Sparkles } from 'lucide-react'
import { useDishes } from '@/hooks/use-dishes-courses'
import { useAssignDishes, useRemoveDish } from '@/hooks/use-dishes-courses'
import { toast } from '@/lib/toast'
import type { MenuCourse, Dish } from '@/types/menu.types'
import { cn } from '@/lib/utils'

interface DishAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: MenuCourse | null
}

const CATEGORY_LABELS: Record<string, string> = {
  'SOUP': 'Zupa',
  'APPETIZER': 'Przek\u0105ska',
  'MAIN_COURSE': 'Danie g\u0142\u00f3wne',
  'SIDE_DISH': 'Przystawka',
  'SALAD': 'Sa\u0142atka',
  'DESSERT': 'Deser',
  'BEVERAGE': 'Nap\u00f3j',
  'OTHER': 'Inne'
}

export function DishAssignmentDialog({ open, onOpenChange, course }: DishAssignmentDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDishes, setSelectedDishes] = useState<Set<string>>(new Set())

  const { data: allDishes = [] } = useDishes({ isActive: true })
  const assignMutation = useAssignDishes()
  const removeMutation = useRemoveDish()

  const assignedDishIds = new Set(course?.options?.map(opt => opt.dish?.id).filter(Boolean) || [])

  useEffect(() => {
    if (open && course) {
      setSelectedDishes(new Set())
      setSearchQuery('')
    }
  }, [open, course])

  const filteredDishes = allDishes.filter(dish => 
    !assignedDishIds.has(dish.id) && (
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const handleToggleDish = (dishId: string) => {
    const newSelected = new Set(selectedDishes)
    if (newSelected.has(dishId)) {
      newSelected.delete(dishId)
    } else {
      newSelected.add(dishId)
    }
    setSelectedDishes(newSelected)
  }

  const handleAssign = async () => {
    if (!course || selectedDishes.size === 0) return

    const loadingToast = toast.loading(`Przypisuj\u0119 ${selectedDishes.size} da\u0144...`)
    
    try {
      await assignMutation.mutateAsync({
        courseId: course.id,
        input: {
          dishes: Array.from(selectedDishes).map(dishId => ({
            dishId,
            isDefault: false,
            isRecommended: false,
          }))
        }
      })
      toast.success('Sukces!', `Przypisano ${selectedDishes.size} da\u0144 do kursu`)
      setSelectedDishes(new Set())
    } catch (error: any) {
      toast.error('B\u0142\u0105d', error.error || 'Nie uda\u0142o si\u0119 przypisa\u0107 da\u0144')
    }
  }

  const handleRemove = async (dishId: string, dishName: string) => {
    if (!course) return

    const loadingToast = toast.loading('Usuwam danie...')
    
    try {
      await removeMutation.mutateAsync({
        courseId: course.id,
        dishId,
        packageId: course.packageId,
      })
      toast.success('Usuni\u0119to!', `Danie "${dishName}" zosta\u0142o usuni\u0119te z kursu`)
    } catch (error: any) {
      toast.error('B\u0142\u0105d', error.error || 'Nie uda\u0142o si\u0119 usun\u0105\u0107 dania')
    }
  }

  const isPending = assignMutation.isPending || removeMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Zarz\u0105dzaj Daniami</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Kurs: <strong>{course?.name}</strong>
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Currently Assigned Dishes */}
          {course?.options && course.options.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Przypisane dania ({course.options.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {course.options.map((option) => (
                  <div 
                    key={option.id} 
                    className="group relative flex items-center justify-between p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        <p className="font-semibold truncate">{option.dish?.name}</p>
                      </div>
                      {option.dish?.category && (
                        <Badge variant="default" className="border border-emerald-300 bg-transparent text-emerald-700 text-xs">
                          {CATEGORY_LABELS[option.dish.category.name] || option.dish.category.name}
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-shrink-0 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 rounded-lg transition-colors"
                      onClick={() => option.dish && handleRemove(option.dish.id, option.dish.name)}
                      disabled={isPending || !option.dish}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Dishes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Dodaj dania
              </h3>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Szukaj da\u0144 po nazwie lub kategorii..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Dishes List */}
            {filteredDishes.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed">
                <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'Brak wynik\u00f3w wyszukiwania' : 'Wszystkie dania ju\u017c przypisane'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {filteredDishes.map((dish) => {
                  const isSelected = selectedDishes.has(dish.id)
                  const categoryName = typeof dish.category === 'string' ? dish.category : dish.category?.name
                  return (
                    <div 
                      key={dish.id}
                      className={cn(
                        "group relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        isSelected 
                          ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-500 shadow-md" 
                          : "bg-background hover:bg-muted/50 border-border hover:border-emerald-300"
                      )}
                      onClick={() => handleToggleDish(dish.id)}
                    >
                      <div className="flex-shrink-0 pt-0.5">
                        <div className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                          isSelected 
                            ? "bg-emerald-500 border-emerald-500" 
                            : "bg-background border-border group-hover:border-emerald-400"
                        )}>
                          {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium truncate mb-1 transition-colors",
                          isSelected && "text-emerald-700 dark:text-emerald-400"
                        )}>
                          {dish.name}
                        </p>
                        {categoryName && (
                          <Badge 
                            variant="default" 
                            className={cn(
                              "text-xs mb-2 bg-transparent border",
                              isSelected 
                                ? "border-emerald-400 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50" 
                                : "border-muted-foreground/30"
                            )}
                          >
                            {CATEGORY_LABELS[categoryName] || categoryName}
                          </Badge>
                        )}
                        {dish.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {dish.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Zamknij
          </Button>
          <Button
            type="button"
            className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg"
            onClick={handleAssign}
            disabled={isPending || selectedDishes.size === 0}
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Przypisuj\u0119...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Przypisz ({selectedDishes.size})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

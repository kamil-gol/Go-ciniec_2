'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Loader2, ChefHat, X } from 'lucide-react'
import { useDishes } from '@/hooks/use-dishes-courses'
import { useAssignDishes, useRemoveDish } from '@/hooks/use-dishes-courses'
import type { MenuCourse, Dish } from '@/types/menu.types'

interface DishAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: MenuCourse | null
}

export function DishAssignmentDialog({ open, onOpenChange, course }: DishAssignmentDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDishes, setSelectedDishes] = useState<Set<string>>(new Set())

  const { data: allDishes = [] } = useDishes({ isActive: true })
  const assignMutation = useAssignDishes()
  const removeMutation = useRemoveDish()

  // Get already assigned dish IDs
  const assignedDishIds = new Set(course?.options?.map(opt => opt.dish.id) || [])

  useEffect(() => {
    if (open && course) {
      // Reset selections when dialog opens
      setSelectedDishes(new Set())
      setSearchQuery('')
    }
  }, [open, course])

  const filteredDishes = allDishes.filter(dish => 
    !assignedDishIds.has(dish.id) && (
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.category?.toLowerCase().includes(searchQuery.toLowerCase())
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
      alert(`✅ Przypisano ${selectedDishes.size} dań do kursu!`)
      setSelectedDishes(new Set())
    } catch (error: any) {
      alert(`❌ Błąd: ${error.error || 'Nieznany błąd'}`)
    }
  }

  const handleRemove = async (dishId: string, dishName: string) => {
    if (!course) return
    if (!confirm(`Czy na pewno chcesz usunąć:\n"${dishName}" z tego kursu?`)) return

    try {
      await removeMutation.mutateAsync({
        courseId: course.id,
        dishId,
        packageId: course.packageId,
      })
      alert(`✅ Usunięto danie z kursu!`)
    } catch (error: any) {
      alert(`❌ Błąd: ${error.error || 'Nieznany błąd'}`)
    }
  }

  const isPending = assignMutation.isPending || removeMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Zarządzaj Daniami: {course?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Currently Assigned Dishes */}
          {course?.options && course.options.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <ChefHat className="h-4 w-4" />
                Przypisane dania ({course.options.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {course.options.map((option) => (
                  <div 
                    key={option.id} 
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{option.dish.name}</p>
                      {option.dish.category && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {option.dish.category}
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="hover:bg-red-100 hover:text-red-600"
                      onClick={() => handleRemove(option.dish.id, option.dish.name)}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Dishes */}
          <div className="space-y-3">
            <h3 className="font-semibold">Dodaj dania</h3>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj dań..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Dishes List */}
            {filteredDishes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'Brak wyników wyszukiwania' : 'Wszystkie dania już przypisane'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {filteredDishes.map((dish) => (
                  <div 
                    key={dish.id}
                    className="flex items-start space-x-3 p-3 border-2 rounded-lg hover:border-emerald-300 transition-colors cursor-pointer"
                    onClick={() => handleToggleDish(dish.id)}
                  >
                    <Checkbox
                      checked={selectedDishes.has(dish.id)}
                      onCheckedChange={() => handleToggleDish(dish.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{dish.name}</p>
                      {dish.category && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {dish.category}
                        </Badge>
                      )}
                      {dish.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {dish.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Zamknij
          </Button>
          <Button
            type="button"
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            onClick={handleAssign}
            disabled={isPending || selectedDishes.size === 0}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Przypisz ({selectedDishes.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

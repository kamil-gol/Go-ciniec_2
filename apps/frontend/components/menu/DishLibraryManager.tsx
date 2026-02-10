'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, Edit, Trash2, Loader2, ChefHat } from 'lucide-react'
import { useDishes, useDeleteDish } from '@/hooks/use-dishes'
import { DishDialog } from './DishDialog'
import { toast } from 'sonner'
import type { Dish } from '@/types'

interface DishLibraryManagerProps {
  searchQuery: string
  setSearchQuery?: (query: string) => void
}

export function DishLibraryManager({ searchQuery, setSearchQuery }: DishLibraryManagerProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL')
  
  const { data: dishes = [], isLoading } = useDishes()
  const deleteDishMutation = useDeleteDish()

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: dishes.length }
    dishes.forEach(dish => {
      const categoryId = dish.category?.id || 'OTHER'
      counts[categoryId] = (counts[categoryId] || 0) + 1
    })
    return counts
  }, [dishes])

  // Get unique categories from dishes
  const availableCategories = useMemo(() => {
    const categoryMap = new Map()
    dishes.forEach(dish => {
      if (dish.category && !categoryMap.has(dish.category.id)) {
        categoryMap.set(dish.category.id, dish.category)
      }
    })
    return Array.from(categoryMap.values()).sort((a, b) => a.displayOrder - b.displayOrder)
  }, [dishes])

  const filteredDishes = useMemo(() => {
    let result = dishes

    // Filter by category
    if (selectedCategoryId !== 'ALL') {
      result = result.filter(dish => dish.category?.id === selectedCategoryId)
    }

    // Filter by search
    if (searchQuery) {
      result = result.filter(dish => 
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return result
  }, [dishes, selectedCategoryId, searchQuery])

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć danie "${name}"?`)) return

    try {
      await deleteDishMutation.mutateAsync(id)
      toast.success(`Danie "${name}" zostało usunięte`)
    } catch (error: any) {
      toast.error(error?.error || 'Nie udało się usunąć dania')
    }
  }

  return (
    <>
      <DishDialog
        open={createOpen || !!editingDish}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false)
            setEditingDish(null)
          }
        }}
        dish={editingDish}
      />

      <div className="space-y-6">
        {/* Search and Add Button */}
        <div className="flex gap-4">
          {setSearchQuery && (
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Szukaj dań..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-2 rounded-xl shadow-sm focus:shadow-lg transition-shadow"
              />
            </div>
          )}
          <Button 
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 h-12 px-6 shadow-lg"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Dodaj Danie
          </Button>
        </div>

        {/* Category Filters */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-emerald-600" />
              Filtruj po kategorii
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategoryId === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategoryId('ALL')}
                className={selectedCategoryId === 'ALL' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600' : ''}
              >
                Wszystkie
                <Badge variant="secondary" className="ml-2">
                  {categoryCounts.ALL || 0}
                </Badge>
              </Button>
              {availableCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategoryId === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={selectedCategoryId === category.id ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600' : ''}
                >
                  {category.icon} {category.name}
                  <Badge variant="secondary" className="ml-2">
                    {categoryCounts[category.id] || 0}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredDishes.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Brak dań</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? 'Nie znaleziono dań pasujących do wyszukiwania' : 'Dodaj pierwsze danie do biblioteki'}
              </p>
              {!searchQuery && (
                <Button 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj danie
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Results header */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Wyświetlono <span className="font-semibold text-foreground">{filteredDishes.length}</span> {filteredDishes.length === 1 ? 'danie' : 'dań'}
                {selectedCategoryId !== 'ALL' && (
                  <span> w kategorii <span className="font-semibold text-foreground">{availableCategories.find(c => c.id === selectedCategoryId)?.name}</span></span>
                )}
              </p>
            </div>

            {/* Dishes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDishes.map((dish) => (
                <Card key={dish.id} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden group">
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 group-hover:from-emerald-500/20 group-hover:via-teal-500/20 group-hover:to-cyan-500/20 transition-all" />
                    <CardHeader className="relative">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                            <ChefHat className="h-6 w-6 text-white" />
                          </div>
                          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                            {dish.category?.icon} {dish.category?.name}
                          </Badge>
                        </div>
                        {!dish.isActive && (
                          <Badge variant="outline" className="border-red-200 text-red-600">
                            Nieaktywne
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl group-hover:text-emerald-600 transition-colors">
                        {dish.name}
                      </CardTitle>
                      {dish.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{dish.description}</p>
                      )}
                    </CardHeader>
                  </div>
                  
                  <CardContent className="space-y-3">
                    {dish.allergens && dish.allergens.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {dish.allergens.map((allergen, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-orange-200 text-orange-600">
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 border-2 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
                        onClick={() => handleEdit(dish)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edytuj
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                        onClick={() => handleDelete(dish.id, dish.name)}
                        disabled={deleteDishMutation.isPending}
                      >
                        {deleteDishMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

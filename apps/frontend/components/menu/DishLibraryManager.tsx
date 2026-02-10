'use client'

import { useState } from 'react'
import { useDishes, useDeleteDish } from '@/hooks/use-dishes'
import { CreateDishDialog } from './CreateDishDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  UtensilsCrossed, 
  Plus, 
  Search, 
  Filter,
  Loader2,
  Edit,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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

export function DishLibraryManager() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [dishToDelete, setDishToDelete] = useState<string | null>(null)
  
  const [filters, setFilters] = useState({
    category: 'all',
    search: '',
    isActive: 'all',
  })

  // Build API filters
  const apiFilters = {
    category: filters.category !== 'all' ? filters.category : undefined,
    search: filters.search || undefined,
    isActive: filters.isActive !== 'all' ? filters.isActive === 'true' : undefined,
  }

  const { data: dishes, isLoading, error } = useDishes(apiFilters)
  const deleteMutation = useDeleteDish()

  const handleDeleteClick = (dishId: string) => {
    setDishToDelete(dishId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (dishToDelete) {
      await deleteMutation.mutateAsync(dishToDelete)
      setDeleteDialogOpen(false)
      setDishToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
            <UtensilsCrossed className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Biblioteka Dań</h1>
            <p className="text-muted-foreground">Zarządzaj wszystkimi daniami</p>
          </div>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Dodaj danie
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filtry</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj dania..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>

            {/* Category */}
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters({ ...filters, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategoria" />
              </SelectTrigger>
              <SelectContent>
                {DISH_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status */}
            <Select
              value={filters.isActive}
              onValueChange={(value) => setFilters({ ...filters, isActive: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                <SelectItem value="true">Aktywne</SelectItem>
                <SelectItem value="false">Nieaktywne</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dishes List */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>Błąd ładowania dań</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && dishes && dishes.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Brak dań</h3>
            <p className="text-muted-foreground mb-4">
              Nie znaleziono dań spełniających kryteria
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Dodaj pierwsze danie
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && dishes && dishes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dishes.map((dish) => (
            <Card key={dish.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {CATEGORY_LABELS[dish.category] || dish.category}
                      </Badge>
                      {!dish.isActive && (
                        <Badge variant="secondary">Nieaktywne</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{dish.name}</CardTitle>
                  </div>
                </div>
                {dish.description && (
                  <CardDescription className="line-clamp-2">
                    {dish.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Allergens */}
                  {dish.allergens && dish.allergens.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Alergeny:</p>
                      <div className="flex flex-wrap gap-1">
                        {dish.allergens.map((allergen) => (
                          <Badge key={allergen} variant="secondary" className="text-xs">
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Modifier */}
                  {dish.priceModifier !== 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Modyfikator: </span>
                      <span className={dish.priceModifier > 0 ? 'text-green-600' : 'text-red-600'}>
                        {dish.priceModifier > 0 ? '+' : ''}{dish.priceModifier} zł
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edytuj
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(dish.id)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateDishDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno usunąć?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Danie zostanie usunięte z biblioteki.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

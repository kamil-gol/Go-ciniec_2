'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Plus, Search, Edit, Trash2, Loader2, Sparkles, AlertTriangle } from 'lucide-react'
import { useMenuOptions, useDeleteMenuOption } from '@/hooks/use-menu-options'
import { MenuOptionDialog } from './MenuOptionDialog'
import { toast } from 'sonner'
import type { MenuOption } from '@/lib/api/menu-options-api'

interface MenuOptionsManagerProps {
  searchQuery: string
  setSearchQuery?: (query: string) => void
}

const CATEGORIES = [
  { value: 'ALL', label: 'Wszystkie', icon: '✨' },
  { value: 'DRINK', label: 'Napoje', icon: '☕' },
  { value: 'ALCOHOL', label: 'Alkohol', icon: '🍷' },
  { value: 'DESSERT', label: 'Desery', icon: '🍰' },
  { value: 'EXTRA_DISH', label: 'Dania dodatkowe', icon: '🍽️' },
  { value: 'SERVICE', label: 'Usługi', icon: '👨‍🍳' },
  { value: 'DECORATION', label: 'Dekoracje', icon: '🎈' },
  { value: 'ENTERTAINMENT', label: 'Rozrywka', icon: '🎵' },
  { value: 'OTHER', label: 'Inne', icon: '❓' },
]

const PRICE_TYPE_LABELS: Record<string, string> = {
  'PER_PERSON': 'Za osobę',
  'PER_ITEM': 'Za sztukę',
  'FLAT': 'Ryczalt',
}

export function MenuOptionsManager({ searchQuery, setSearchQuery }: MenuOptionsManagerProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<MenuOption | null>(null)
  const [deletingOption, setDeletingOption] = useState<{ id: string; name: string } | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  
  const { data: options = [], isLoading } = useMenuOptions()
  const deleteMutation = useDeleteMenuOption()

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: options.length }
    options.forEach(option => {
      counts[option.category] = (counts[option.category] || 0) + 1
    })
    return counts
  }, [options])

  const filteredOptions = useMemo(() => {
    let result = options

    // Filter by category
    if (selectedCategory !== 'ALL') {
      result = result.filter(option => option.category === selectedCategory)
    }

    // Filter by search
    if (searchQuery) {
      result = result.filter(option => 
        option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return result
  }, [options, selectedCategory, searchQuery])

  const handleEdit = (option: MenuOption) => {
    setEditingOption(option)
  }

  const handleDeleteClick = (id: string, name: string) => {
    setDeletingOption({ id, name })
  }

  const handleDeleteConfirm = async () => {
    if (!deletingOption) return

    try {
      await deleteMutation.mutateAsync(deletingOption.id)
      toast.success(`Opcja "${deletingOption.name}" została usunięta`)
      setDeletingOption(null)
    } catch (error: any) {
      toast.error(error?.error || 'Nie udało się usunąć opcji')
    }
  }

  return (
    <>
      <MenuOptionDialog
        open={createOpen || !!editingOption}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false)
            setEditingOption(null)
          }
        }}
        option={editingOption}
      />

      {/* Premium Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingOption} onOpenChange={(open) => !open && setDeletingOption(null)}>
        <AlertDialogContent className="border-0 shadow-2xl max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-red-500 to-rose-500 rounded-full shadow-lg">
                <AlertTriangle className="h-10 w-10 text-white" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-2xl">
              Usunąć opcję?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              Czy na pewno chcesz usunąć opcję{' '}
              <span className="font-semibold text-foreground">"{deletingOption?.name}"</span>?
              <br />
              <span className="text-red-600 dark:text-red-400 font-medium">Tej operacji nie można cofnąć.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-6">
            <AlertDialogCancel className="w-full sm:w-auto h-11 border-2">
              Anuluj
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="w-full sm:w-auto h-11 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-lg"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Usuwanie...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Usuń opcję
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        {/* Search and Add Button */}
        <div className="flex gap-4">
          {setSearchQuery && (
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Szukaj opcji..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-2 rounded-xl shadow-sm focus:shadow-lg transition-shadow"
              />
            </div>
          )}
          <Button 
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 px-6 shadow-lg"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Dodaj Opcję
          </Button>
        </div>

        {/* Category Filters */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Filtruj po kategorii
            </h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className={selectedCategory === category.value ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : ''}
                >
                  {category.icon} {category.label}
                  <Badge variant="secondary" className="ml-2">
                    {categoryCounts[category.value] || 0}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOptions.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Brak opcji</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? 'Nie znaleziono opcji pasujących do wyszukiwania' : 'Dodaj pierwszą opcję menu'}
              </p>
              {!searchQuery && (
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj opcję
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Results header */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Wyświetlono <span className="font-semibold text-foreground">{filteredOptions.length}</span> {filteredOptions.length === 1 ? 'opcję' : 'opcji'}
                {selectedCategory !== 'ALL' && (
                  <span> w kategorii <span className="font-semibold text-foreground">{CATEGORIES.find(c => c.value === selectedCategory)?.label}</span></span>
                )}
              </p>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOptions.map((option) => (
                <Card key={option.id} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden group">
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 group-hover:from-purple-500/20 group-hover:via-pink-500/20 group-hover:to-rose-500/20 transition-all" />
                    <CardHeader className="relative">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {option.icon && (
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg text-2xl">
                              {option.icon}
                            </div>
                          )}
                          <div>
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                              {CATEGORIES.find(c => c.value === option.category)?.label}
                            </Badge>
                            <Badge variant="outline" className="ml-2">
                              {PRICE_TYPE_LABELS[option.priceType]}
                            </Badge>
                          </div>
                        </div>
                        {!option.isActive && (
                          <Badge variant="outline" className="border-red-200 text-red-600">
                            Nieaktywne
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                        {option.name}
                      </CardTitle>
                      {option.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{option.description}</p>
                      )}
                    </CardHeader>
                  </div>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-purple-600">
                        {parseFloat(option.priceAmount).toFixed(2)} zł
                      </span>
                      {option.allowMultiple && (
                        <Badge variant="secondary">
                          Max: {option.maxQuantity}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 border-2 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-colors"
                        onClick={() => handleEdit(option)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edytuj
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                        onClick={() => handleDeleteClick(option.id, option.name)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
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

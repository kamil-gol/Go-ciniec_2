'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Loader2, Tags, ArrowLeft, Info } from 'lucide-react'
import Link from 'next/link'
import { useDishCategories, useCreateDishCategory, useUpdateDishCategory, useDeleteDishCategory } from '@/hooks/use-dish-categories'
import { toast } from 'sonner'
import type { DishCategory } from '@/types'

export default function DishCategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<DishCategory | null>(null)
  
  const { data: categories = [], isLoading } = useDishCategories()
  const createMutation = useCreateDishCategory()
  const updateMutation = useUpdateDishCategory()
  const deleteMutation = useDeleteDishCategory()

  // Sortuj kategorie po displayOrder, potem po nazwie
  const sortedCategories = [...categories].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder
    }
    return a.name.localeCompare(b.name)
  })

  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    icon: '',
    color: 'bg-gray-100 text-gray-700',
    displayOrder: 0,
  })

  // Aktualizuj formularz gdy edytujesz kategorię
  useEffect(() => {
    if (editingCategory) {
      setFormData({
        slug: editingCategory.slug,
        name: editingCategory.name,
        icon: editingCategory.icon || '',
        color: editingCategory.color || 'bg-gray-100 text-gray-700',
        displayOrder: editingCategory.displayOrder,
      })
    }
  }, [editingCategory])

  const resetForm = () => {
    setFormData({
      slug: '',
      name: '',
      icon: '',
      color: 'bg-gray-100 text-gray-700',
      displayOrder: 0,
    })
    setEditingCategory(null)
  }

  const handleEdit = (category: DishCategory) => {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    // Ustaw kolejność na najwyższą +1
    const maxOrder = categories.length > 0 
      ? Math.max(...categories.map(c => c.displayOrder)) + 1
      : 0
    
    resetForm()
    setFormData(prev => ({ ...prev, displayOrder: maxOrder }))
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setTimeout(() => resetForm(), 200) // Czekaj na animację zamykania
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Nazwa i slug są wymagane')
      return
    }

    if (formData.displayOrder < 0) {
      toast.error('Kolejność nie może być ujemna')
      return
    }

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({ id: editingCategory.id, data: formData })
      } else {
        await createMutation.mutateAsync(formData)
      }
      handleClose()
    } catch (error: any) {
      toast.error(error?.message || 'Wystąpił błąd')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć kategorię "${name}"?`)) return

    try {
      await deleteMutation.mutateAsync(id)
    } catch (error: any) {
      toast.error(error?.message || 'Nie udało się usunąć kategorii')
    }
  }

  const colorOptions = [
    { value: 'bg-red-100 text-red-700', label: 'Czerwony' },
    { value: 'bg-orange-100 text-orange-700', label: 'Pomarańczowy' },
    { value: 'bg-yellow-100 text-yellow-700', label: 'Żółty' },
    { value: 'bg-green-100 text-green-700', label: 'Zielony' },
    { value: 'bg-blue-100 text-blue-700', label: 'Niebieski' },
    { value: 'bg-purple-100 text-purple-700', label: 'Fioletowy' },
    { value: 'bg-pink-100 text-pink-700', label: 'Różowy' },
    { value: 'bg-gray-100 text-gray-700', label: 'Szary' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
        
        <div className="container mx-auto px-6 py-12 relative z-10">
          <Link href="/dashboard/menu">
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powrót do Menu
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                <Tags className="h-12 w-12" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Kategorie Dań</h1>
                <p className="text-white/90 text-lg mt-1">Zarządzaj kategoriami w systemie</p>
              </div>
            </div>
            
            <Button 
              className="bg-white text-purple-600 hover:bg-white/90 shadow-lg"
              onClick={handleCreate}
            >
              <Plus className="h-5 w-5 mr-2" />
              Dodaj Kategorię
            </Button>
          </div>
        </div>
      </div>

      {/* Info banner */}
      {categories.length > 0 && (
        <div className="container mx-auto px-6 pt-6">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">Kolejność wyświetlania</p>
              <p>Kategorie są sortowane po numerze kolejności (niższa = wcześniej). Kilka kategorii może mieć tę samą kolejność - wtedy są sortowane alfabetycznie.</p>
            </div>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) handleClose()
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edytuj Kategorię' : 'Nowa Kategoria'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa (polska)</Label>
              <Input
                id="name"
                placeholder="Zupy"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (unikalny identyfikator)</Label>
              <Input
                id="slug"
                placeholder="SOUP"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toUpperCase() })}
                disabled={!!editingCategory}
              />
              <p className="text-xs text-muted-foreground">Używany w kodzie - tylko duże litery, bez spacji</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="icon">Ikona (emoji)</Label>
              <Input
                id="icon"
                placeholder="🍜"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Kolor</Label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`px-3 py-2 rounded-lg border-2 ${
                      formData.color === color.value ? 'border-purple-500' : 'border-transparent'
                    } ${color.value} font-semibold`}
                  >
                    {color.label.charAt(0)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="order">Kolejność wyświetlania</Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={formData.displayOrder}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  setFormData({ ...formData, displayOrder: Math.max(0, value) })
                }}
              />
              <p className="text-xs text-muted-foreground">
                Obecne kolejności: {sortedCategories.map(c => `${c.name} (${c.displayOrder})`).join(', ')}
              </p>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingCategory ? 'Zapisz zmiany' : 'Dodaj'}
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Anuluj
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Content */}
      <div className="container mx-auto px-6 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tags className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Brak kategorii</h3>
              <p className="text-muted-foreground mb-6">
                Dodaj pierwszą kategorię dań
              </p>
              <Button 
                className="bg-gradient-to-r from-purple-500 to-pink-500"
                onClick={handleCreate}
              >
                <Plus className="mr-2 h-4 w-4" />
                Dodaj kategorię
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedCategories.map((category, index) => (
              <Card key={category.id} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden group">
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 group-hover:from-purple-500/20 group-hover:via-pink-500/20 group-hover:to-rose-500/20 transition-all" />
                  
                  {/* Pozycja badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-purple-600 text-white font-bold">
                      #{index + 1}
                    </Badge>
                  </div>
                  
                  <CardHeader className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-3xl">{category.icon}</div>
                      {!category.isActive && (
                        <Badge className="border border-red-200 text-red-600 bg-red-50 dark:bg-red-950/50">
                          Nieaktywna
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                      {category.name}
                    </CardTitle>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground mt-2">
                      <Badge className={`w-fit border ${category.color}`}>
                        {category.name}
                      </Badge>
                      <div className="text-xs">
                        Slug: <span className="font-mono text-muted-foreground/70">{category.slug}</span>
                      </div>
                      <div className="text-xs">
                        Kolejność: {category.displayOrder}
                      </div>
                    </div>
                  </CardHeader>
                </div>
                
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 border-2 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-colors"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edytuj
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                      onClick={() => handleDelete(category.id, category.name)}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
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
        )}
      </div>
    </div>
  )
}

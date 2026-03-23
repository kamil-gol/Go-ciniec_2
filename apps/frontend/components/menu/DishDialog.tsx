'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useCreateDish, useUpdateDish } from '@/hooks/use-dishes'
import { useDishCategories } from '@/hooks/use-menu-config'
import { toast } from 'sonner'
import type { Dish } from '@/lib/api/dishes-api'
import { Loader2 } from 'lucide-react'

interface DishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dish?: Dish | null
}

export function DishDialog({ open, onOpenChange, dish }: DishDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    allergens: '',
    isActive: true,
  })

  const createMutation = useCreateDish()
  const updateMutation = useUpdateDish()
  const { data: categories = [] } = useDishCategories()

  // Initialize form when dialog opens or dish changes
  useEffect(() => {
    if (open) {
      if (dish) {
        setFormData({
          name: dish.name,
          description: dish.description || '',
          categoryId: dish.categoryId || '',
          allergens: dish.allergens?.join(', ') || '',
          isActive: dish.isActive ?? true,
        })
      } else {
        // Set first category as default only when creating new dish
        setFormData({
          name: '',
          description: '',
          categoryId: categories.length > 0 ? categories[0].id : '',
          allergens: '',
          isActive: true,
        })
      }
    }
  }, [dish, open, categories])

  const handleSubmit = async () => {
    if (!formData.name || !formData.categoryId) {
      toast.error('Nazwa i kategoria są wymagane')
      return
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        categoryId: formData.categoryId,
        allergens: formData.allergens ? formData.allergens.split(',').map(a => a.trim()) : [],
        isActive: formData.isActive,
      }

      if (dish) {
        await updateMutation.mutateAsync({ id: dish.id, data: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch (error: any) {
      // Error handling is done in the mutation hooks
      console.error('Submit error:', error)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{dish ? 'Edytuj Danie' : 'Dodaj Nowe Danie'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Nazwa dania *</Label>
            <Input
              placeholder="np. Rosół, Schabowy, Tiramisu"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Opis</Label>
            <Textarea
              placeholder="Opcjonalny opis dania"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Kategoria *</Label>
            <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Wybierz kategorię" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categories.length === 0 && (
              <p className="text-xs text-amber-600">
                ⚠️ Brak kategorii. Dodaj kategorię w sekcji &quot;Kategorie Dań&quot;.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Alergeny (oddzielone przecinkami)</Label>
            <Input
              placeholder="np. gluten, laktoza, orzechy"
              value={formData.allergens}
              onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Przykłady: gluten, dairy, eggs, nuts, shellfish, fish, soy, celery
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-sm font-semibold">Aktywne danie</Label>
              <p className="text-xs text-muted-foreground mt-1">Nieaktywne dania nie będą wyświetlane w systemie</p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Anuluj
            </Button>
            <Button
              type="button"
              className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg"
              onClick={handleSubmit}
              disabled={isPending || !formData.name || !formData.categoryId}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {dish ? 'Zaktualizuj' : 'Utwórz'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

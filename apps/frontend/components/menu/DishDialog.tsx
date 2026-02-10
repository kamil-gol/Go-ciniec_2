'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useCreateDish, useUpdateDish } from '@/hooks/use-dishes-courses'
import type { Dish } from '@/types/menu.types'
import { Loader2 } from 'lucide-react'

interface DishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dish?: Dish | null
}

const DISH_CATEGORIES = [
  'SOUP',
  'APPETIZER', 
  'MAIN_COURSE',
  'SIDE_DISH',
  'SALAD',
  'DESSERT',
  'BEVERAGE',
  'OTHER'
]

const CATEGORY_LABELS: Record<string, string> = {
  'SOUP': 'Zupa',
  'APPETIZER': 'Przekąska',
  'MAIN_COURSE': 'Danie główne',
  'SIDE_DISH': 'Przystawka',
  'SALAD': 'Sałatka',
  'DESSERT': 'Deser',
  'BEVERAGE': 'Napój',
  'OTHER': 'Inne'
}

export function DishDialog({ open, onOpenChange, dish }: DishDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'MAIN_COURSE',
    allergens: '',
    priceModifier: '0',
    isActive: true,
  })

  const createMutation = useCreateDish()
  const updateMutation = useUpdateDish()

  useEffect(() => {
    if (dish) {
      setFormData({
        name: dish.name,
        description: dish.description || '',
        category: dish.category || 'MAIN_COURSE',
        allergens: dish.allergens?.join(', ') || '',
        priceModifier: String(dish.priceModifier || 0),
        isActive: dish.isActive ?? true,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'MAIN_COURSE',
        allergens: '',
        priceModifier: '0',
        isActive: true,
      })
    }
  }, [dish])

  const handleSubmit = async () => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        allergens: formData.allergens ? formData.allergens.split(',').map(a => a.trim()) : [],
        priceModifier: parseFloat(formData.priceModifier) || 0,
        isActive: formData.isActive,
      }

      if (dish) {
        await updateMutation.mutateAsync({ id: dish.id, data: payload })
        alert('✅ Zaktualizowano danie!')
      } else {
        await createMutation.mutateAsync(payload)
        alert('✅ Utworzono danie!')
      }
      onOpenChange(false)
    } catch (error: any) {
      alert(`❌ Błąd: ${error.error || 'Nieznany błąd'}`)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dish ? 'Edytuj Danie' : 'Dodaj Nowe Danie'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Nazwa dania *</Label>
            <Input
              placeholder="np. Rosoł, Schabowy, Tiramisu"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Opis</Label>
            <Textarea
              placeholder="Opcjonalny opis dania"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Kategoria *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISH_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Alergeny (oddzielone przecinkami)</Label>
            <Input
              placeholder="np. gluten, laktoza, orzechy"
              value={formData.allergens}
              onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Modyfikator ceny (zł)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.priceModifier}
              onChange={(e) => setFormData({ ...formData, priceModifier: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Dodatnia wartość zwiększa cenę, ujemna obniża
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label>Aktywne danie</Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Anuluj
            </Button>
            <Button
              type="button"
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              onClick={handleSubmit}
              disabled={isPending || !formData.name}
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

'use client'

import { useState } from 'react'
import { useCreateDish } from '@/hooks/use-dishes'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, UtensilsCrossed, Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface CreateDishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DISH_CATEGORIES = [
  { value: 'APPETIZER', label: 'Przystawka' },
  { value: 'SOUP', label: 'Zupa' },
  { value: 'MAIN_COURSE', label: 'Danie g\u0142\u00f3wne' },
  { value: 'SIDE_DISH', label: 'Dodatek' },
  { value: 'SALAD', label: 'Sa\u0142atka' },
  { value: 'DESSERT', label: 'Deser' },
  { value: 'DRINK', label: 'Nap\u00f3j' },
]

export function CreateDishDialog({ open, onOpenChange }: CreateDishDialogProps) {
  const createMutation = useCreateDish()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'MAIN_COURSE',
  })

  const [allergens, setAllergens] = useState<string[]>([])
  const [allergenInput, setAllergenInput] = useState('')

  const handleAddAllergen = () => {
    if (allergenInput.trim() && !allergens.includes(allergenInput.trim())) {
      setAllergens([...allergens, allergenInput.trim()])
      setAllergenInput('')
    }
  }

  const handleRemoveAllergen = (allergen: string) => {
    setAllergens(allergens.filter(a => a !== allergen))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createMutation.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        categoryId: formData.category,
        allergens: allergens.length > 0 ? allergens : undefined,
        isActive: true,
      })
      
      // Reset form and close
      setFormData({
        name: '',
        description: '',
        category: 'MAIN_COURSE',
      })
      setAllergens([])
      onOpenChange(false)
    } catch (error: any) {
      console.error('Failed to create dish:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                <UtensilsCrossed className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Nowe Danie</DialogTitle>
                <DialogDescription>
                  Dodaj nowe danie do biblioteki
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa *</Label>
              <Input
                id="name"
                placeholder="np. Stek wo\u0142owy z grilla"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Kategoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
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

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                placeholder="Opis dania, sk\u0142adniki, spos\u00f3b przygotowania..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Allergens */}
            <div className="space-y-2">
              <Label htmlFor="allergens">Alergeny</Label>
              <div className="flex gap-2">
                <Input
                  id="allergens"
                  placeholder="np. gluten, laktoza"
                  value={allergenInput}
                  onChange={(e) => setAllergenInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddAllergen()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddAllergen}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {allergens.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {allergens.map((allergen) => (
                    <Badge key={allergen} variant="default" className="gap-1 bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
                      {allergen}
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergen(allergen)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Dodawanie...
                </>
              ) : (
                'Dodaj danie'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

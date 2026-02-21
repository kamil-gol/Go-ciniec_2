'use client'

import { useState, useEffect } from 'react'
import { useUpdateOption } from '@/hooks/use-menu'
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
import { Loader2, Sparkles } from 'lucide-react'
import type { MenuOption } from '@/types/menu.types'

interface EditOptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  option: MenuOption | null
}

const CATEGORIES = [
  'Alkohol',
  'Napoje',
  'Muzyka',
  'Dekoracje',
  'Animacje',
  'Fotografia',
  'Transport',
  'Inne',
]

// Map from MenuOption priceType to form priceType
function mapPriceTypeToForm(priceType: string): 'PER_PERSON' | 'FIXED' | 'FREE' {
  switch (priceType) {
    case 'PER_PERSON': return 'PER_PERSON'
    case 'FLAT': return 'FIXED'
    case 'FREE': return 'FREE'
    default: return 'PER_PERSON'
  }
}

// Map from form priceType back to API priceType
function mapPriceTypeToApi(priceType: string): 'PER_PERSON' | 'FLAT' | 'FREE' {
  switch (priceType) {
    case 'PER_PERSON': return 'PER_PERSON'
    case 'FIXED': return 'FLAT'
    case 'FREE': return 'FREE'
    default: return 'PER_PERSON'
  }
}

export function EditOptionDialog({ open, onOpenChange, option }: EditOptionDialogProps) {
  const updateMutation = useUpdateOption()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Alkohol',
    priceAmount: '',
    priceType: 'PER_PERSON' as 'PER_PERSON' | 'FIXED' | 'FREE',
  })

  // Populate form when option changes
  useEffect(() => {
    if (option) {
      setFormData({
        name: option.name,
        description: option.description || '',
        category: option.category,
        priceAmount: option.priceAmount.toString(),
        priceType: mapPriceTypeToForm(option.priceType),
      })
    }
  }, [option])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!option) return
    
    try {
      await updateMutation.mutateAsync({
        id: option.id,
        data: {
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category,
          priceAmount: parseFloat(formData.priceAmount),
          priceType: mapPriceTypeToApi(formData.priceType),
        },
      })
      
      onOpenChange(false)
      alert('✅ Opcja została zaktualizowana!')
    } catch (error: any) {
      alert(`❌ Błąd: ${error.error || 'Nie udało się zaktualizować opcji'}`)
    }
  }

  if (!option) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Edytuj Opcję</DialogTitle>
                <DialogDescription>
                  Modyfikuj ustawienia opcji dodatkowej
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
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
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Amount */}
            <div className="space-y-2">
              <Label htmlFor="price">Cena (zł) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.priceAmount}
                onChange={(e) => setFormData({ ...formData, priceAmount: e.target.value })}
                required
                disabled={formData.priceType === 'FREE'}
              />
            </div>

            {/* Price Type */}
            <div className="space-y-2">
              <Label htmlFor="priceType">Typ ceny *</Label>
              <Select
                value={formData.priceType}
                onValueChange={(value: 'PER_PERSON' | 'FIXED' | 'FREE') => 
                  setFormData({ ...formData, priceType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_PERSON">Za osobę</SelectItem>
                  <SelectItem value="FIXED">Stała cena</SelectItem>
                  <SelectItem value="FREE">Gratis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                'Zapisz zmiany'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

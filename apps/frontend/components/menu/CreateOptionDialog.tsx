'use client'

import { useState } from 'react'
import { useCreateOption } from '@/hooks/use-menu'
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

interface CreateOptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function CreateOptionDialog({ open, onOpenChange }: CreateOptionDialogProps) {
  const createMutation = useCreateOption()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Alkohol',
    priceAmount: '',
    priceType: 'PER_PERSON' as 'PER_PERSON' | 'FIXED',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createMutation.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        priceAmount: parseFloat(formData.priceAmount),
        priceType: formData.priceType,
        isActive: true,
      })
      
      // Reset form and close
      setFormData({
        name: '',
        description: '',
        category: 'Alkohol',
        priceAmount: '',
        priceType: 'PER_PERSON',
      })
      onOpenChange(false)
      alert('✅ Opcja została dodana!')
    } catch (error: any) {
      alert(`❌ Błąd: ${error.error || 'Nie udało się dodać opcji'}`)
    }
  }

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
                <DialogTitle className="text-2xl">Nowa Opcja Dodatkowa</DialogTitle>
                <DialogDescription>
                  Dodaj nową opcję jak alkohol, DJ, dekoracje
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
                placeholder="np. DJ - pakiet premium"
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
                placeholder="Opcjonalny opis opcji..."
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
                placeholder="0.00"
                value={formData.priceAmount}
                onChange={(e) => setFormData({ ...formData, priceAmount: e.target.value })}
                required
              />
            </div>

            {/* Price Type */}
            <div className="space-y-2">
              <Label htmlFor="priceType">Typ ceny *</Label>
              <Select
                value={formData.priceType}
                onValueChange={(value: 'PER_PERSON' | 'FIXED') => 
                  setFormData({ ...formData, priceType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_PERSON">Za osobę</SelectItem>
                  <SelectItem value="FIXED">Stała cena</SelectItem>
                </SelectContent>
              </Select>
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
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Dodawanie...
                </>
              ) : (
                'Dodaj opcję'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

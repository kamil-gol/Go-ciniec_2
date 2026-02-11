'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useCreateMenuOption, useUpdateMenuOption } from '@/hooks/use-menu-options'
import { toast } from 'sonner'
import type { MenuOption } from '@/lib/api/menu-options-api'
import { Loader2 } from 'lucide-react'

interface MenuOptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  option?: MenuOption | null
}

// Category options with icons and translations
const CATEGORIES = [
  { value: 'DRINK', label: 'Napoje', icon: '☕' },
  { value: 'ALCOHOL', label: 'Alkohol', icon: '🍷' },
  { value: 'DESSERT', label: 'Desery', icon: '🍰' },
  { value: 'EXTRA_DISH', label: 'Dodatkowe danie', icon: '🍽️' },
  { value: 'SERVICE', label: 'Usługa', icon: '👨‍🍳' },
  { value: 'DECORATION', label: 'Dekoracja', icon: '🎈' },
  { value: 'ENTERTAINMENT', label: 'Rozrywka', icon: '🎵' },
  { value: 'OTHER', label: 'Inne', icon: '❓' },
]

const PRICE_TYPES = [
  { value: 'PER_PERSON', label: 'Za osobę' },
  { value: 'PER_ITEM', label: 'Za sztukę' },
  { value: 'FLAT', label: 'Cena ryczaltowa' },
]

export function MenuOptionDialog({ open, onOpenChange, option }: MenuOptionDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: 'DRINK',
    priceType: 'PER_PERSON',
    priceAmount: '',
    allowMultiple: false,
    maxQuantity: '1',
    icon: '',
    isActive: true,
  })

  const createMutation = useCreateMenuOption()
  const updateMutation = useUpdateMenuOption()

  // Initialize form when dialog opens or option changes
  useEffect(() => {
    if (open) {
      if (option) {
        setFormData({
          name: option.name,
          description: option.description || '',
          shortDescription: option.shortDescription || '',
          category: option.category,
          priceType: option.priceType,
          priceAmount: option.priceAmount || '',
          allowMultiple: option.allowMultiple,
          maxQuantity: option.maxQuantity.toString(),
          icon: option.icon || '',
          isActive: option.isActive,
        })
      } else {
        setFormData({
          name: '',
          description: '',
          shortDescription: '',
          category: 'DRINK',
          priceType: 'PER_PERSON',
          priceAmount: '',
          allowMultiple: false,
          maxQuantity: '1',
          icon: '',
          isActive: true,
        })
      }
    }
  }, [option, open])

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.priceType) {
      toast.error('Nazwa, kategoria i typ ceny są wymagane')
      return
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        shortDescription: formData.shortDescription || null,
        category: formData.category,
        priceType: formData.priceType,
        priceAmount: parseFloat(formData.priceAmount) || 0,
        allowMultiple: formData.allowMultiple,
        maxQuantity: parseInt(formData.maxQuantity) || 1,
        icon: formData.icon || null,
        isActive: formData.isActive,
      }

      if (option) {
        await updateMutation.mutateAsync({ id: option.id, data: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch (error: any) {
      console.error('Submit error:', error)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {option ? 'Edytuj Opcję Menu' : 'Dodaj Nową Opcję Menu'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Nazwa opcji *</Label>
            <Input
              placeholder="np. Dodatkowa kawa, Deser owocowy, DJ na imprezę"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Kategoria *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Typ ceny *</Label>
              <Select value={formData.priceType} onValueChange={(value) => setFormData({ ...formData, priceType: value })}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Wybierz typ ceny" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Cena (PLN)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.priceAmount}
                onChange={(e) => setFormData({ ...formData, priceAmount: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Ikona emoji</Label>
              <Input
                placeholder="☕ 🍰 🎈"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Krótki opis</Label>
            <Input
              placeholder="Krótki opis opcji (max 100 znaków)"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              maxLength={100}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Pełny opis</Label>
            <Textarea
              placeholder="Szczegółowy opis opcji"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-sm font-semibold">Można wybrać wiele</Label>
              <p className="text-xs text-muted-foreground mt-1">Klient może wybrać tę opcję wielokrotnie</p>
            </div>
            <Switch
              checked={formData.allowMultiple}
              onCheckedChange={(checked) => setFormData({ ...formData, allowMultiple: checked })}
            />
          </div>

          {formData.allowMultiple && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Maksymalna ilość</Label>
              <Input
                type="number"
                min="1"
                value={formData.maxQuantity}
                onChange={(e) => setFormData({ ...formData, maxQuantity: e.target.value })}
                className="h-11 w-32"
              />
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-sm font-semibold">Aktywna opcja</Label>
              <p className="text-xs text-muted-foreground mt-1">Nieaktywne opcje nie będą wyświetlane</p>
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
              disabled={isPending || !formData.name || !formData.category || !formData.priceType}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {option ? 'Zaktualizuj' : 'Utwórz'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useUpdateTemplate, useEventTypes } from '@/hooks/use-menu'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, UtensilsCrossed } from 'lucide-react'
import type { MenuTemplate } from '@/types/menu.types'

interface EditTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: MenuTemplate | null
}

export function EditTemplateDialog({ open, onOpenChange, template }: EditTemplateDialogProps) {
  const updateMutation = useUpdateTemplate()
  const { data: eventTypes = [] } = useEventTypes()
  
  const [formData, setFormData] = useState({
    name: '',
    variant: '',
    eventTypeId: '',
    validFrom: '',
    validTo: '',
    isActive: true,
  })

  // Populate form when template changes
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        variant: template.variant || '',
        eventTypeId: template.eventTypeId,
        validFrom: template.validFrom.split('T')[0],
        validTo: template.validTo?.split('T')[0] || '',
        isActive: template.isActive,
      })
    }
  }, [template])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!template) return
    
    try {
      await updateMutation.mutateAsync({
        id: template.id,
        data: {
          name: formData.name,
          variant: formData.variant || undefined,
          eventTypeId: formData.eventTypeId,
          validFrom: formData.validFrom,
          validTo: formData.validTo || undefined,
          isActive: formData.isActive,
        },
      })
      
      onOpenChange(false)
      alert('✅ Szablon menu został zaktualizowany!')
    } catch (error: any) {
      alert(`❌ Błąd: ${error.error || 'Nie udało się zaktualizować szablonu'}`)
    }
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl">
                <UtensilsCrossed className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Edytuj Szablon Menu</DialogTitle>
                <DialogDescription>
                  Modyfikuj ustawienia szablonu menu
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

            {/* Variant */}
            <div className="space-y-2">
              <Label htmlFor="variant">Wariant</Label>
              <Input
                id="variant"
                value={formData.variant}
                onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
              />
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <Label htmlFor="eventType">Typ wydarzenia *</Label>
              <Select
                value={formData.eventTypeId}
                onValueChange={(value) => setFormData({ ...formData, eventTypeId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Ważny od *</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validTo">Ważny do</Label>
                <Input
                  id="validTo"
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, isActive: checked as boolean })
                }
              />
              <Label
                htmlFor="isActive"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Aktywny (dostępny do wyboru)
              </Label>
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
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
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

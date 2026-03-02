'use client'

import { useState, useEffect } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Loader2, Check } from 'lucide-react'
import {
  createEventType,
  updateEventType,
  getPredefinedColors,
  type EventType,
  type CreateEventTypeData,
  type UpdateEventTypeData,
} from '@/lib/api/event-types-api'
import { useToast } from '@/hooks/use-toast'

interface EventTypeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventType?: EventType | null
  onSuccess: () => void
}

const DEFAULT_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E', '#14B8A6',
]

export function EventTypeFormDialog({ open, onOpenChange, eventType, onSuccess }: EventTypeFormDialogProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [colors, setColors] = useState<string[]>(DEFAULT_COLORS)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [standardHours, setStandardHours] = useState(6)
  const [extraHourRate, setExtraHourRate] = useState(500)

  const isEditing = !!eventType

  useEffect(() => {
    if (open) {
      if (eventType) {
        setName(eventType.name)
        setDescription(eventType.description || '')
        setColor(eventType.color)
        setIsActive(eventType.isActive)
        setStandardHours(eventType.standardHours ?? 6)
        setExtraHourRate(eventType.extraHourRate ?? 500)
      } else {
        setName('')
        setDescription('')
        setColor(null)
        setIsActive(true)
        setStandardHours(6)
        setExtraHourRate(500)
      }
      getPredefinedColors().then(setColors).catch(() => setColors(DEFAULT_COLORS))
    }
  }, [open, eventType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({ title: 'B\u0142\u0105d', description: 'Nazwa typu jest wymagana', variant: 'destructive' })
      return
    }

    try {
      setSaving(true)

      if (isEditing && eventType) {
        const payload: UpdateEventTypeData = {
          name: name.trim(),
          description: description.trim() || null,
          color: color,
          isActive,
          standardHours,
          extraHourRate,
        }
        await updateEventType(eventType.id, payload)
        toast({ title: 'Zaktualizowano', description: `Typ "${name}" zosta\u0142 zaktualizowany` })
      } else {
        const payload: CreateEventTypeData = {
          name: name.trim(),
          description: description.trim() || undefined,
          color: color || undefined,
          isActive,
          standardHours,
          extraHourRate,
        }
        await createEventType(payload)
        toast({ title: 'Utworzono', description: `Typ "${name}" zosta\u0142 utworzony` })
      }

      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Wyst\u0105pi\u0142 b\u0142\u0105d'
      toast({ title: 'B\u0142\u0105d', description: msg, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white dark:bg-neutral-900">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edytuj typ wydarzenia' : 'Nowy typ wydarzenia'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Zmie\u0144 parametry typu wydarzenia'
                : 'Utw\u00f3rz nowy typ wydarzenia dla systemu rezerwacji'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa *</Label>
              <Input
                id="name"
                placeholder="np. Wesele, Komunia, Urodziny..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                placeholder="Kr\u00f3tki opis typu wydarzenia..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Kolor</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(color === c ? null : c)}
                    className="relative h-8 w-8 rounded-full border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? '#1F2937' : 'transparent',
                    }}
                  >
                    {color === c && (
                      <Check className="h-4 w-4 text-white absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}
              </div>
              {color && (
                <p className="text-xs text-neutral-400">Wybrany: {color}</p>
              )}
            </div>

            {/* Standard Hours */}
            <div className="space-y-2">
              <Label htmlFor="standardHours">Godziny w cenie (standard)</Label>
              <Input
                id="standardHours"
                type="number"
                min={1}
                max={24}
                step={1}
                value={standardHours}
                onChange={(e) => setStandardHours(Number(e.target.value) || 6)}
                className="h-11"
              />
              <p className="text-xs text-neutral-500">
                Ile godzin jest wliczonych w cen\u0119 podstawow\u0105 (domy\u015blnie 6h)
              </p>
            </div>

            {/* Extra Hour Rate */}
            <div className="space-y-2">
              <Label htmlFor="extraHourRate">Stawka za dodatkow\u0105 godzin\u0119 (z\u0142)</Label>
              <Input
                id="extraHourRate"
                type="number"
                min={0}
                step={50}
                value={extraHourRate}
                onChange={(e) => setExtraHourRate(Number(e.target.value) || 0)}
                className="h-11"
              />
              <p className="text-xs text-neutral-500">
                Koszt ka\u017cdej godziny powy\u017cej standardu (domy\u015blnie 500 z\u0142/h)
              </p>
            </div>

            {/* Is Active */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Aktywny</Label>
                <p className="text-sm text-neutral-500">
                  Nieaktywne typy nie s\u0105 widoczne przy tworzeniu rezerwacji
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Anuluj
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Zapisz zmiany' : 'Utw\u00f3rz typ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

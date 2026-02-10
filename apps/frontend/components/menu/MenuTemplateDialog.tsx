'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { useEventTypes } from '@/hooks/use-event-types'
import {
  useCreateMenuTemplate,
  useUpdateMenuTemplate,
} from '@/hooks/use-menu-templates'
import type { MenuTemplate } from '@/lib/api/menu-templates-api'

interface MenuTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: MenuTemplate | null
}

interface FormData {
  eventTypeId: string
  name: string
  description: string
  variant: string
  validFrom: string
  validTo: string
  isActive: boolean
  displayOrder: number
}

export function MenuTemplateDialog({
  open,
  onOpenChange,
  template,
}: MenuTemplateDialogProps) {
  const isEdit = !!template
  const { data: eventTypes = [], isLoading: loadingEventTypes } = useEventTypes()
  const createMutation = useCreateMenuTemplate()
  const updateMutation = useUpdateMenuTemplate()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      eventTypeId: '',
      name: '',
      description: '',
      variant: '',
      validFrom: '',
      validTo: '',
      isActive: true,
      displayOrder: 0,
    },
  })

  const isActive = watch('isActive')

  // Load template data when editing
  useEffect(() => {
    if (template && open) {
      reset({
        eventTypeId: template.eventTypeId,
        name: template.name,
        description: template.description || '',
        variant: template.variant || '',
        validFrom: template.validFrom ? template.validFrom.split('T')[0] : '',
        validTo: template.validTo ? template.validTo.split('T')[0] : '',
        isActive: template.isActive,
        displayOrder: template.displayOrder,
      })
    } else if (!template && open) {
      reset({
        eventTypeId: '',
        name: '',
        description: '',
        variant: '',
        validFrom: '',
        validTo: '',
        isActive: true,
        displayOrder: 0,
      })
    }
  }, [template, open, reset])

  const onSubmit = async (data: FormData) => {
    const input = {
      eventTypeId: data.eventTypeId,
      name: data.name,
      description: data.description || null,
      variant: data.variant || null,
      validFrom: data.validFrom || null,
      validTo: data.validTo || null,
      isActive: data.isActive,
      displayOrder: Number(data.displayOrder),
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: template.id, input })
      } else {
        await createMutation.mutateAsync(input)
      }
      onOpenChange(false)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edytuj szablon menu' : 'Nowy szablon menu'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Zaktualizuj informacje o szablonie menu'
              : 'Utwórz nowy szablon menu dla typu wydarzenia'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="eventTypeId">
              Typ wydarzenia <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch('eventTypeId')}
              onValueChange={(value) => setValue('eventTypeId', value)}
              disabled={loadingEventTypes || isEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz typ wydarzenia" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.eventTypeId && (
              <p className="text-sm text-red-500">{errors.eventTypeId.message}</p>
            )}
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Nie można zmienić typu wydarzenia dla istniejącego szablonu
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nazwa <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name', { required: 'Nazwa jest wymagana' })}
              placeholder="np. Menu Standard"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Variant */}
          <div className="space-y-2">
            <Label htmlFor="variant">Wariant</Label>
            <Input
              id="variant"
              {...register('variant')}
              placeholder="np. Sezon Letni, Promocja"
            />
            <p className="text-xs text-muted-foreground">
              Opcjonalna nazwa wariantu (sezon, promocja, etc.)
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Szczegółowy opis szablonu menu"
              rows={3}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Ważne od</Label>
              <Input id="validFrom" type="date" {...register('validFrom')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validTo">Ważne do</Label>
              <Input id="validTo" type="date" {...register('validTo')} />
            </div>
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <Label htmlFor="displayOrder">Kolejność wyświetlania</Label>
            <Input
              id="displayOrder"
              type="number"
              {...register('displayOrder', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Niższy numer = wyżej na liście
            </p>
          </div>

          {/* Active Switch */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Szablon aktywny
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Zapisz zmiany' : 'Utwórz szablon'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

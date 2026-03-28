'use client'

import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import { Loader2, Plus, X } from 'lucide-react'
import { useCreatePackage, useUpdatePackage } from '@/hooks/use-menu-config'
import type { MenuPackage } from '@/lib/api/menu-packages-api'

interface MenuPackageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  package?: MenuPackage | null
}

interface FormData {
  name: string
  description: string
  shortDescription: string
  pricePerAdult: number
  pricePerChild: number
  pricePerToddler: number
  color: string
  icon: string
  badgeText: string
  isPopular: boolean
  isRecommended: boolean
  includedItems: { value: string }[]
  minGuests: number | ''
  maxGuests: number | ''
}

export function MenuPackageDialog({
  open,
  onOpenChange,
  templateId,
  package: pkg,
}: MenuPackageDialogProps) {
  const isEdit = !!pkg
  const createMutation = useCreatePackage()
  const updateMutation = useUpdatePackage()

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    mode: 'onBlur',
    defaultValues: {
      name: '',
      description: '',
      shortDescription: '',
      pricePerAdult: 0,
      pricePerChild: 0,
      pricePerToddler: 0,
      color: '',
      icon: '',
      badgeText: '',
      isPopular: false,
      isRecommended: false,
      includedItems: [],
      minGuests: '',
      maxGuests: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'includedItems',
  })

  const isPopular = watch('isPopular')
  const isRecommended = watch('isRecommended')

  useEffect(() => {
    if (pkg && open) {
      reset({
        name: pkg.name,
        description: pkg.description || '',
        shortDescription: pkg.shortDescription || '',
        pricePerAdult: Number(pkg.pricePerAdult) || 0,
        pricePerChild: Number(pkg.pricePerChild) || 0,
        pricePerToddler: Number(pkg.pricePerToddler) || 0,
        color: pkg.color || '',
        icon: pkg.icon || '',
        badgeText: pkg.badgeText || '',
        isPopular: pkg.isPopular,
        isRecommended: pkg.isRecommended,
        includedItems: pkg.includedItems.map((item) => ({ value: item })),
        minGuests: pkg.minGuests || '',
        maxGuests: pkg.maxGuests || '',
      })
    } else if (!pkg && open) {
      reset({
        name: '',
        description: '',
        shortDescription: '',
        pricePerAdult: 0,
        pricePerChild: 0,
        pricePerToddler: 0,
        color: '#3B82F6',
        icon: '🍽️',
        badgeText: '',
        isPopular: false,
        isRecommended: false,
        includedItems: [],
        minGuests: '',
        maxGuests: '',
      })
    }
  }, [pkg, open, reset])

  const onSubmit = async (data: FormData) => {
    const input = {
      menuTemplateId: templateId,
      name: data.name,
      description: data.description || null,
      shortDescription: data.shortDescription || null,
      pricePerAdult: data.pricePerAdult,
      pricePerChild: data.pricePerChild,
      pricePerToddler: data.pricePerToddler,
      color: data.color || null,
      icon: data.icon || null,
      badgeText: data.badgeText || null,
      isPopular: data.isPopular,
      isRecommended: data.isRecommended,
      includedItems: data.includedItems.map((item) => item.value).filter(Boolean),
      minGuests: data.minGuests === '' ? null : Number(data.minGuests),
      maxGuests: data.maxGuests === '' ? null : Number(data.maxGuests),
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: pkg.id, input })
      } else {
        await createMutation.mutateAsync(input)
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edytuj pakiet' : 'Nowy pakiet menu'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Zaktualizuj informacje o pakiecie'
              : 'Utwórz nowy pakiet menu dla tego szablonu'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nazwa pakietu <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name', { required: 'Nazwa jest wymagana' })}
              placeholder="np. Pakiet Standard"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor="shortDescription">Krótki opis</Label>
            <Input
              id="shortDescription"
              {...register('shortDescription')}
              placeholder="Opis w jednym zdaniu"
              maxLength={500}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Pełny opis</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Szczegółowy opis pakietu"
              rows={3}
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricePerAdult">
                Cena/dorosły (zł) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pricePerAdult"
                type="number"
                step="0.01"
                {...register('pricePerAdult', {
                  required: 'Cena jest wymagana',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Cena musi być większa od 0' },
                })}
              />
              {errors.pricePerAdult && (
                <p className="text-sm text-red-500">{errors.pricePerAdult.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerChild">Cena/dziecko (zł)</Label>
              <Input
                id="pricePerChild"
                type="number"
                step="0.01"
                {...register('pricePerChild', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerToddler">Cena/maluch (zł)</Label>
              <Input
                id="pricePerToddler"
                type="number"
                step="0.01"
                {...register('pricePerToddler', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Guest Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minGuests">Min. liczba gości</Label>
              <Input
                id="minGuests"
                type="number"
                {...register('minGuests')}
                placeholder="Bez limitu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxGuests">Max. liczba gości</Label>
              <Input
                id="maxGuests"
                type="number"
                {...register('maxGuests')}
                placeholder="Bez limitu"
              />
            </div>
          </div>

          {/* Styling */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Kolor</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={watch('color') || '#3B82F6'}
                  onChange={(e) => setValue('color', e.target.value)}
                  className="h-10 w-20"
                />
                <Input {...register('color')} placeholder="#3B82F6" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Ikona (emoji)</Label>
              <Input id="icon" {...register('icon')} placeholder="🍽️" maxLength={4} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="badgeText">Badge</Label>
              <Input id="badgeText" {...register('badgeText')} placeholder="np. HIT!" />
            </div>
          </div>

          {/* Included Items */}
          <div className="space-y-2">
            <Label>Co zawiera pakiet?</Label>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    {...register(`includedItems.${index}.value`)}
                    placeholder="np. Przystawka na ciepło"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => remove(index)}
                    aria-label="Usuń element"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ value: '' })}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Dodaj pozycję
              </Button>
            </div>
          </div>

          {/* Switches */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="isPopular"
                checked={isPopular}
                onCheckedChange={(checked) => setValue('isPopular', checked)}
              />
              <Label htmlFor="isPopular" className="cursor-pointer">
                Popularny pakiet
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isRecommended"
                checked={isRecommended}
                onCheckedChange={(checked) => setValue('isRecommended', checked)}
              />
              <Label htmlFor="isRecommended" className="cursor-pointer">
                Polecany pakiet
              </Label>
            </div>
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
              {isEdit ? 'Zapisz zmiany' : 'Utwórz pakiet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

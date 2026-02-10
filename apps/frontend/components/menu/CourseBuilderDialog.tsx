'use client'

import { useState, useEffect } from 'react'
import { useCreateCourse, useUpdateCourse } from '@/hooks/use-menu-courses'
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
import { Loader2, BookOpen } from 'lucide-react'
import type { MenuCourse } from '@/types/menu.types'

interface CourseBuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  packageId: string
  course?: MenuCourse // If provided, edit mode
}

export function CourseBuilderDialog({
  open,
  onOpenChange,
  packageId,
  course,
}: CourseBuilderDialogProps) {
  const createMutation = useCreateCourse()
  const updateMutation = useUpdateCourse()
  const isEditMode = !!course
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    minSelect: '1',
    maxSelect: '1',
    isRequired: true,
    icon: '',
  })

  // Load course data in edit mode
  useEffect(() => {
    if (course) {
      setFormData({
        name: course.name,
        description: course.description || '',
        minSelect: String(course.minSelect),
        maxSelect: String(course.maxSelect),
        isRequired: course.isRequired,
        icon: course.icon || '',
      })
    } else {
      setFormData({
        name: '',
        description: '',
        minSelect: '1',
        maxSelect: '1',
        isRequired: true,
        icon: '',
      })
    }
  }, [course, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const minSelect = parseInt(formData.minSelect)
    const maxSelect = parseInt(formData.maxSelect)

    // Validation
    if (maxSelect < minSelect) {
      alert('Maksymalna liczba wyborów musi być większa lub równa minimalnej')
      return
    }

    try {
      if (isEditMode && course) {
        await updateMutation.mutateAsync({
          id: course.id,
          input: {
            name: formData.name,
            description: formData.description || undefined,
            minSelect,
            maxSelect,
            isRequired: formData.isRequired,
            icon: formData.icon || undefined,
          },
        })
      } else {
        await createMutation.mutateAsync({
          packageId,
          name: formData.name,
          description: formData.description || undefined,
          minSelect,
          maxSelect,
          isRequired: formData.isRequired,
          icon: formData.icon || undefined,
        })
      }
      
      onOpenChange(false)
    } catch (error: any) {
      console.error('Failed to save course:', error)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">
                  {isEditMode ? 'Edytuj Kurs' : 'Nowy Kurs Menu'}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode ? 'Zmodyfikuj kurs w pakiecie' : 'Dodaj kurs do pakietu'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa kursu *</Label>
              <Input
                id="name"
                placeholder="np. Danie główne"
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
                placeholder="Opcjonalny opis kursu..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            {/* Min/Max Select */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minSelect">Min. wyborów *</Label>
                <Input
                  id="minSelect"
                  type="number"
                  min="0"
                  value={formData.minSelect}
                  onChange={(e) => setFormData({ ...formData, minSelect: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSelect">Max. wyborów *</Label>
                <Input
                  id="maxSelect"
                  type="number"
                  min="1"
                  value={formData.maxSelect}
                  onChange={(e) => setFormData({ ...formData, maxSelect: e.target.value })}
                  required
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Określ ile dań klient może/musi wybrać w tym kursie
            </p>

            {/* Required */}
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="required" className="cursor-pointer">
                Kurs wymagany
              </Label>
              <Switch
                id="required"
                checked={formData.isRequired}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, isRequired: checked })
                }
              />
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label htmlFor="icon">Ikona (opcjonalnie)</Label>
              <Input
                id="icon"
                placeholder="np. utensils"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Nazwa ikony z Lucide Icons
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : isEditMode ? (
                'Zapisz zmiany'
              ) : (
                'Dodaj kurs'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

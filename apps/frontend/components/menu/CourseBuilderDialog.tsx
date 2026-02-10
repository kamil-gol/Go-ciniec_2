'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useCreateMenuCourse, useUpdateMenuCourse } from '@/hooks/use-dishes-courses'
import type { MenuCourse } from '@/types/menu.types'
import { Loader2 } from 'lucide-react'

interface CourseBuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  packageId: string | null
  course?: MenuCourse | null
}

export function CourseBuilderDialog({ open, onOpenChange, packageId, course }: CourseBuilderDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    minSelect: '1',
    maxSelect: '1',
    isRequired: true,
  })

  const createMutation = useCreateMenuCourse()
  const updateMutation = useUpdateMenuCourse()

  useEffect(() => {
    if (course) {
      setFormData({
        name: course.name,
        description: course.description || '',
        minSelect: String(course.minSelect),
        maxSelect: String(course.maxSelect),
        isRequired: course.isRequired ?? true,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        minSelect: '1',
        maxSelect: '1',
        isRequired: true,
      })
    }
  }, [course, open])

  const handleSubmit = async () => {
    if (!packageId && !course) {
      alert('❌ Brak wybranego pakietu!')
      return
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        minSelect: parseInt(formData.minSelect) || 1,
        maxSelect: parseInt(formData.maxSelect) || 1,
        isRequired: formData.isRequired,
      }

      if (course) {
        await updateMutation.mutateAsync({ id: course.id, data: payload })
        alert('✅ Zaktualizowano kurs!')
      } else {
        await createMutation.mutateAsync({
          packageId: packageId!,
          ...payload,
        })
        alert('✅ Utworzono kurs!')
      }
      onOpenChange(false)
    } catch (error: any) {
      alert(`❌ Błąd: ${error.error || 'Nieznany błąd'}`)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{course ? 'Edytuj Kurs Menu' : 'Dodaj Nowy Kurs'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Nazwa kursu *</Label>
            <Input
              placeholder="np. Zupa, Danie główne, Deser"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Opis</Label>
            <Textarea
              placeholder="Opcjonalny opis kursu"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min. wyborów *</Label>
              <Input
                type="number"
                min="0"
                value={formData.minSelect}
                onChange={(e) => setFormData({ ...formData, minSelect: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Maks. wyborów *</Label>
              <Input
                type="number"
                min="1"
                value={formData.maxSelect}
                onChange={(e) => setFormData({ ...formData, maxSelect: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.isRequired}
              onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
            />
            <Label>Kurs wymagany</Label>
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
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              onClick={handleSubmit}
              disabled={isPending || !formData.name}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {course ? 'Zaktualizuj' : 'Utwórz'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

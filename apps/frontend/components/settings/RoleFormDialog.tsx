'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { settingsApi, Role } from '@/lib/api/settings'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const COLORS = ['#DC2626', '#2563EB', '#059669', '#6B7280', '#D97706', '#7C3AED', '#DB2777', '#0891B2']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  onSaved: () => void
}

export function RoleFormDialog({ open, onOpenChange, role, onSaved }: Props) {
  const isEdit = !!role
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#6B7280',
  })

  useEffect(() => {
    if (role) {
      setForm({
        name: role.name,
        slug: role.slug,
        description: role.description || '',
        color: role.color,
      })
    } else {
      setForm({ name: '', slug: '', description: '', color: '#6B7280' })
    }
  }, [role, open])

  // Auto-generate slug from name (only for new roles)
  const handleNameChange = (name: string) => {
    setForm(f => ({
      ...f,
      name,
      slug: isEdit ? f.slug : name.toLowerCase()
        .replace(/[ąàáâã]/g, 'a').replace(/[ęèéêë]/g, 'e')
        .replace(/[ićìíîï]/g, 'i').replace(/[óòôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u').replace(/[żźñ]/g, 'z')
        .replace(/[łl]/g, 'l').replace(/[śs]/g, 's')
        .replace(/[ćc]/g, 'c').replace(/[ń]/g, 'n')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, ''),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit) {
        await settingsApi.updateRole(role!.id, {
          name: form.name,
          description: form.description || undefined,
          color: form.color,
        })
        toast.success('Zaktualizowano rolę')
      } else {
        await settingsApi.createRole({
          name: form.name,
          slug: form.slug,
          description: form.description || undefined,
          color: form.color,
          permissionIds: [],
        })
        toast.success('Utworzono rolę — przypisz uprawnienia rozwijając ją na liście')
      }
      onSaved()
    } catch { /* handled */ } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edytuj rolę' : 'Nowa rola'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roleName">Nazwa</Label>
            <Input
              id="roleName"
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
              required
              placeholder="np. Koordynator"
            />
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="roleSlug">Slug</Label>
              <Input
                id="roleSlug"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                required
                placeholder="koordynator"
                className="font-mono text-sm"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="roleDesc">Opis</Label>
            <Input
              id="roleDesc"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Krótki opis roli (opcjonalnie)"
            />
          </div>

          <div className="space-y-2">
            <Label>Kolor</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    form.color === color
                      ? 'border-neutral-900 dark:border-white scale-110'
                      : 'border-transparent hover:border-neutral-300'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setForm(f => ({ ...f, color }))}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Zapisywanie...' : isEdit ? 'Zapisz zmiany' : 'Utwórz'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

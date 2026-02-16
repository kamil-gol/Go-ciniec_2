'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { settingsApi, User, Role, CreateUserInput, UpdateUserInput } from '@/lib/api/settings'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  roles: Role[]
  onSaved: () => void
}

export function UserFormDialog({ open, onOpenChange, user, roles, onSaved }: Props) {
  const isEdit = !!user
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleId: '',
  })

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email,
        password: '',
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId || '',
      })
    } else {
      setForm({ email: '', password: '', firstName: '', lastName: '', roleId: '' })
    }
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit) {
        const input: UpdateUserInput = {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          roleId: form.roleId || undefined,
        }
        await settingsApi.updateUser(user!.id, input)
        toast.success('Zaktualizowano użytkownika')
      } else {
        const input: CreateUserInput = {
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          roleId: form.roleId,
        }
        await settingsApi.createUser(input)
        toast.success('Utworzono użytkownika')
      }
      onSaved()
    } catch {
      // api-client handles toast
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edytuj użytkownika' : 'Nowy użytkownik'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Imię</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nazwisko</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
                placeholder="Min. 8 znaków"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Rola</Label>
            <Select value={form.roleId} onValueChange={v => setForm(f => ({ ...f, roleId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz rolę" />
              </SelectTrigger>
              <SelectContent>
                {roles.filter(r => r.isActive).map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: role.color }} />
                      {role.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

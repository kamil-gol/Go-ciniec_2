'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { settingsApi, User } from '@/lib/api/settings'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function ChangePasswordDialog({ open, onOpenChange, user }: Props) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Hasła nie są identyczne')
      return
    }
    if (!user) return
    setSaving(true)
    try {
      await settingsApi.changePassword(user.id, password)
      toast.success(`Zmieniono hasło dla ${user.firstName} ${user.lastName}`)
      setPassword('')
      setConfirm('')
      onOpenChange(false)
    } catch {
      // api-client handles toast
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Zmień hasło</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-neutral-500">
          Zmiana hasła dla: <strong>{user?.firstName} {user?.lastName}</strong>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nowe hasło</Label>
            <Input
              id="newPassword"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Min. 8 znaków"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Zapisywanie...' : 'Zmień hasło'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

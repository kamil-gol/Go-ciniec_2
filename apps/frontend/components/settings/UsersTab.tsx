'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, KeyRound, ToggleLeft, ToggleRight, Search } from 'lucide-react'
import { toast } from 'sonner'
import { settingsApi, User, Role } from '@/lib/api/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { UserFormDialog } from './UserFormDialog'
import { ChangePasswordDialog } from './ChangePasswordDialog'

export function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [passwordTarget, setPasswordTarget] = useState<User | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [usersData, rolesData] = await Promise.all([
        settingsApi.getUsers(),
        settingsApi.getRoles(),
      ])
      setUsers(usersData)
      setRoles(rolesData)
    } catch {
      // api-client handles toast
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase()
    return (
      (u.firstName || '').toLowerCase().includes(q) ||
      (u.lastName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role?.name || '').toLowerCase().includes(q)
    )
  })

  const handleToggleActive = async (user: User) => {
    try {
      const updated = await settingsApi.toggleActive(user.id)
      // Defensive merge — spread existing data, then overwrite with API response
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updated } : u))
      toast.success(`${updated.isActive ? 'Aktywowano' : 'Dezaktywowano'} użytkownika ${user.firstName}`)
    } catch { /* handled */ }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await settingsApi.deleteUser(deleteTarget.id)
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
      toast.success(`Usunięto użytkownika ${deleteTarget.firstName} ${deleteTarget.lastName}`)
    } catch { /* handled */ }
    setDeleteTarget(null)
  }

  const handleSaved = () => {
    setFormOpen(false)
    setEditingUser(null)
    fetchData()
  }

  if (loading) return (
    <div data-testid="loading-state" className="space-y-4">
      {/* Search bar skeleton */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-80 rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
      {/* Table header skeleton */}
      <Skeleton className="h-10 w-full rounded-lg" />
      {/* Table rows skeleton */}
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Szukaj użytkownika..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => { setEditingUser(null); setFormOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" />
          Dodaj użytkownika
        </Button>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            {search ? 'Brak wyników wyszukiwania' : 'Brak użytkowników'}
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className="rounded-xl border border-neutral-200 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/80 p-4 space-y-3">
              {/* Row 1: User + Status */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-sm font-semibold text-neutral-600 dark:text-neutral-300 flex-shrink-0">
                    {(user.firstName?.[0] || '')}{(user.lastName?.[0] || '')}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-300 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Badge variant={user.isActive ? 'default' : 'secondary'} className="flex-shrink-0">
                  {user.isActive ? 'Aktywny' : 'Nieaktywny'}
                </Badge>
              </div>

              {/* Row 2: Role + Last Login */}
              <div className="flex items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-300">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">Rola:</span>
                  {user.role ? (
                    <Badge
                      className="font-semibold border-transparent text-white shadow-sm text-[10px] px-2 py-0.5"
                      style={{ backgroundColor: user.role.color }}
                    >
                      {user.role.name}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">Brak roli</Badge>
                  )}
                </div>
                <span>
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString('pl-PL')
                    : 'Nigdy'}
                </span>
              </div>

              {/* Row 3: Actions */}
              <div className="flex items-center justify-end gap-1 border-t border-neutral-100 dark:border-neutral-700/50 pt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Edytuj"
                  aria-label="Edytuj użytkownika"
                  onClick={() => { setEditingUser(user); setFormOpen(true) }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Zmień hasło"
                  aria-label="Zmień hasło"
                  onClick={() => setPasswordTarget(user)}
                >
                  <KeyRound className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title={user.isActive ? 'Dezaktywuj' : 'Aktywuj'}
                  aria-label={user.isActive ? 'Dezaktywuj użytkownika' : 'Aktywuj użytkownika'}
                  onClick={() => handleToggleActive(user)}
                >
                  {user.isActive
                    ? <ToggleRight className="h-4 w-4 text-green-600" />
                    : <ToggleLeft className="h-4 w-4 text-neutral-400" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Usuń"
                  aria-label="Usuń użytkownika"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => setDeleteTarget(user)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl bg-white dark:bg-neutral-800/80 shadow-soft border border-neutral-100 dark:border-neutral-700/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Użytkownik</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rola</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ostatnie logowanie</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-neutral-500">
                  {search ? 'Brak wyników wyszukiwania' : 'Brak użytkowników'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                        {(user.firstName?.[0] || '')}{(user.lastName?.[0] || '')}
                      </div>
                      <span>{user.firstName} {user.lastName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-neutral-500">{user.email}</TableCell>
                  <TableCell>
                    {user.role ? (
                      <Badge
                        className="font-semibold border-transparent text-white shadow-sm"
                        style={{ backgroundColor: user.role.color }}
                      >
                        {user.role.name}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Brak roli</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? 'Aktywny' : 'Nieaktywny'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-neutral-500 text-sm">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString('pl-PL')
                      : 'Nigdy'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edytuj"
                        aria-label="Edytuj użytkownika"
                        onClick={() => { setEditingUser(user); setFormOpen(true) }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Zmień hasło"
                        aria-label="Zmień hasło"
                        onClick={() => setPasswordTarget(user)}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={user.isActive ? 'Dezaktywuj' : 'Aktywuj'}
                        aria-label={user.isActive ? 'Dezaktywuj użytkownika' : 'Aktywuj użytkownika'}
                        onClick={() => handleToggleActive(user)}
                      >
                        {user.isActive
                          ? <ToggleRight className="h-4 w-4 text-green-600" />
                          : <ToggleLeft className="h-4 w-4 text-neutral-400" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Usuń"
                        aria-label="Usuń użytkownika"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => setDeleteTarget(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editingUser}
        roles={roles}
        onSaved={handleSaved}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={!!passwordTarget}
        onOpenChange={(open) => { if (!open) setPasswordTarget(null) }}
        user={passwordTarget}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć użytkownika?</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć użytkownika{' '}
              <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong>?
              Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

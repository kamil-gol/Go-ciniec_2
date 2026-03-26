'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Users, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { settingsApi, Role, PermissionGroup } from '@/lib/api/settings'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingState } from '@/components/shared'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { RoleFormDialog } from './RoleFormDialog'

const MODULE_LABELS: Record<string, string> = {
  archive: 'Archiwum',
  attachments: 'Załączniki',
  audit_log: 'Dziennik audytu',
  clients: 'Klienci',
  dashboard: 'Panel główny',
  deposits: 'Zaliczki',
  event_types: 'Typy wydarzeń',
  halls: 'Sale',
  menu: 'Menu',
  queue: 'Kolejka',
  reports: 'Raporty',
  reservations: 'Rezerwacje',
  settings: 'Ustawienia',
}

export function RolesTab() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [expandedRole, setExpandedRole] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [rolesData, permsData] = await Promise.all([
        settingsApi.getRoles(),
        settingsApi.getPermissionsGrouped(),
      ])
      setRoles(rolesData)
      setPermissionGroups(permsData)
    } catch { /* handled */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const togglePermission = async (role: Role, permId: string) => {
    const currentIds = role.permissions.map(p => p.id)
    const newIds = currentIds.includes(permId)
      ? currentIds.filter(id => id !== permId)
      : [...currentIds, permId]

    setSaving(role.id)
    try {
      const updated = await settingsApi.updateRolePermissions(role.id, newIds)
      setRoles(prev => prev.map(r => r.id === role.id ? updated : r))
    } catch { /* handled */ } finally {
      setSaving(null)
    }
  }

  const toggleAllInModule = async (role: Role, group: PermissionGroup) => {
    const currentIds = role.permissions.map(p => p.id)
    const modulePermIds = group.permissions.map(p => p.id)
    const allChecked = modulePermIds.every(id => currentIds.includes(id))

    let newIds: string[]
    if (allChecked) {
      newIds = currentIds.filter(id => !modulePermIds.includes(id))
    } else {
      const toAdd = modulePermIds.filter(id => !currentIds.includes(id))
      newIds = [...currentIds, ...toAdd]
    }

    setSaving(role.id)
    try {
      const updated = await settingsApi.updateRolePermissions(role.id, newIds)
      setRoles(prev => prev.map(r => r.id === role.id ? updated : r))
    } catch { /* handled */ } finally {
      setSaving(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await settingsApi.deleteRole(deleteTarget.id)
      setRoles(prev => prev.filter(r => r.id !== deleteTarget.id))
      toast.success(`Usunięto rolę "${deleteTarget.name}"`)
    } catch { /* handled */ }
    setDeleteTarget(null)
  }

  const handleSaved = () => {
    setFormOpen(false)
    setEditingRole(null)
    fetchData()
  }

  if (loading) return <LoadingState message="Ładowanie ról i uprawnień..." />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">Kliknij rolę aby rozwinąć macierz uprawnień</p>
        <Button onClick={() => { setEditingRole(null); setFormOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" />
          Dodaj rolę
        </Button>
      </div>

      {/* Roles list */}
      <div className="space-y-3">
        {roles.map(role => {
          const isExpanded = expandedRole === role.id
          const rolePermIds = new Set(role.permissions.map(p => p.id))

          return (
            <div
              key={role.id}
              className="rounded-2xl bg-white dark:bg-neutral-800/80 shadow-soft border border-neutral-100 dark:border-neutral-700/50 overflow-hidden"
            >
              {/* Role header */}
              <div
                className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors"
                onClick={() => setExpandedRole(isExpanded ? null : role.id)}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: role.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{role.name}</span>
                    <Badge variant="outline" className="text-xs">{role.slug}</Badge>
                    {role.isSystem && <Badge variant="secondary" className="text-xs">Systemowa</Badge>}
                  </div>
                  {role.description && (
                    <p className="text-sm text-neutral-500 truncate">{role.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {role.usersCount ?? 0}
                  </div>
                  <span>{role.permissions.length} uprawnień</span>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Edytuj"
                    aria-label="Edytuj rolę"
                    onClick={() => { setEditingRole(role); setFormOpen(true) }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!role.isSystem && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Usuń"
                      aria-label="Usuń rolę"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => setDeleteTarget(role)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Permission matrix */}
              {isExpanded && (
                <div className="border-t border-neutral-100 dark:border-neutral-700/50 px-6 py-4">
                  <div className="space-y-4">
                    {permissionGroups.map(group => {
                      const modulePermIds2 = group.permissions.map(p => p.id)
                      const checkedCount = modulePermIds2.filter(id => rolePermIds.has(id)).length
                      const allChecked = checkedCount === modulePermIds2.length
                      const someChecked = checkedCount > 0 && !allChecked

                      return (
                        <div key={group.module}>
                          <div className="flex items-center gap-3 mb-2">
                            <Checkbox
                              checked={allChecked}
                              className={someChecked ? 'opacity-60' : ''}
                              onCheckedChange={() => toggleAllInModule(role, group)}
                              disabled={saving === role.id}
                            />
                            <span className="font-medium text-sm">
                              {MODULE_LABELS[group.module] || group.moduleLabel || group.module}
                            </span>
                            <span className="text-xs text-neutral-400">
                              {checkedCount}/{modulePermIds2.length}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 ml-7">
                            {group.permissions.map(perm => (
                              <label
                                key={perm.id}
                                className="flex items-center gap-2 py-1 px-2 rounded hover:bg-neutral-50 dark:hover:bg-neutral-700/30 cursor-pointer"
                              >
                                <Checkbox
                                  checked={rolePermIds.has(perm.id)}
                                  onCheckedChange={() => togglePermission(role, perm.id)}
                                  disabled={saving === role.id}
                                />
                                <span className="text-sm">{perm.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Create / Edit Dialog */}
      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        role={editingRole}
        onSaved={handleSaved}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć rolę?</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć rolę <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong>?
              Użytkownicy z tą rolą stracą przypisane uprawnienia.
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

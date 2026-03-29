'use client'

import { useState } from 'react'
import {
  Users, Mail, Phone, Star, Plus, Pencil, Trash2, X, Save, Briefcase, MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GradientCard } from '@/components/shared/GradientCard'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useConfirmDialog } from '@/hooks/use-confirm-dialog'
import {
  addClientContact,
  updateClientContact,
  removeClientContact,
  type ClientContact,
  type CreateClientContactInput,
} from '@/lib/api/clients'
import { toast } from 'sonner'

interface ContactsManagerProps {
  clientId: string
  contacts: ClientContact[]
  readOnly?: boolean
  onUpdate: () => void
}

interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  isPrimary: boolean
}

const EMPTY_FORM: ContactFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: '',
  isPrimary: false,
}

export function ContactsManager({ clientId, contacts, readOnly = false, onUpdate }: ContactsManagerProps) {
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ContactFormData>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const openAddForm = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setShowForm(true)
  }

  const openEditForm = (contact: ClientContact) => {
    setEditingId(contact.id)
    setFormData({
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      phone: contact.phone || '',
      role: contact.role || '',
      isPrimary: contact.isPrimary || false,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData(EMPTY_FORM)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Imię i nazwisko są wymagane')
      return
    }

    try {
      setLoading(true)

      const payload: CreateClientContactInput = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        role: formData.role.trim() || undefined,
        isPrimary: formData.isPrimary,
      }

      if (editingId) {
        await updateClientContact(clientId, editingId, payload)
        toast.success('Osoba kontaktowa została zaktualizowana')
      } else {
        await addClientContact(clientId, payload)
        toast.success('Osoba kontaktowa została dodana')
      }

      closeForm()
      onUpdate()
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || error.message || 'Wystąpił błąd')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (contactId: string, contactName: string) => {
    if (!await confirm({ title: 'Usuwanie kontaktu', description: `Czy na pewno chcesz usunąć osobę kontaktową ${contactName}?`, variant: 'destructive', confirmLabel: 'Usuń' })) return

    try {
      setDeletingId(contactId)
      await removeClientContact(clientId, contactId)
      toast.success(`Usunięto osobę kontaktową: ${contactName}`)
      onUpdate()
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Nie udało się usunąć kontaktu')
    } finally {
      setDeletingId(null)
    }
  }

  const handleTogglePrimary = async (contact: ClientContact) => {
    try {
      await updateClientContact(clientId, contact.id, { isPrimary: !contact.isPrimary })
      toast.success(contact.isPrimary
          ? `${contact.firstName} ${contact.lastName} nie jest już główną osobą kontaktową`
          : `${contact.firstName} ${contact.lastName} ustawiony jako główna osoba kontaktowa`)
      onUpdate()
    } catch {
      toast.error('Nie udało się zmienić statusu kontaktu')
    }
  }

  return (
    <GradientCard
      title="Osoby kontaktowe"
      icon={<Users className="h-5 w-5 text-white" />}
      iconGradient="from-amber-500 to-orange-500"
      headerGradient="from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30"
      badge={
        <span className="text-sm text-muted-foreground">
          {contacts.length === 0 ? 'Brak dodanych kontaktów' : contacts.length === 1 ? '1 osoba' : `${contacts.length} osoby`}
        </span>
      }
      action={!readOnly && !showForm ? (
        <Button
          onClick={openAddForm}
          size="sm"
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Dodaj
        </Button>
      ) : undefined}
    >

        {/* Add/Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white dark:bg-black/20 rounded-xl border-2 border-amber-200 dark:border-amber-800/50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-amber-700 dark:text-amber-400 text-sm">
                {editingId ? 'Edytuj osobę kontaktową' : 'Nowa osoba kontaktowa'}
              </h3>
              <Button type="button" variant="ghost" size="sm" onClick={closeForm} className="h-7 w-7 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="contact-firstName" className="text-xs font-medium">Imię *</Label>
                <Input id="contact-firstName" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Jan" required className="h-9" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contact-lastName" className="text-xs font-medium">Nazwisko *</Label>
                <Input id="contact-lastName" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Kowalski" required className="h-9" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contact-email" className="text-xs font-medium">Email</Label>
                <Input id="contact-email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="jan@firma.pl" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contact-phone" className="text-xs font-medium">Telefon</Label>
                <Input id="contact-phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+48 123 456 789" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contact-role" className="text-xs font-medium">Stanowisko</Label>
                <Input id="contact-role" name="role" value={formData.role} onChange={handleChange} placeholder="np. Dyrektor" className="h-9" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
                  className="w-4 h-4 rounded border-2 border-amber-400 text-amber-500 focus:ring-amber-500"
                />
                <Star className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-sm">Główna osoba kontaktowa</span>
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={closeForm} className="flex-1 h-9 text-sm" disabled={loading}>
                Anuluj
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 h-9 text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {loading ? 'Zapisywanie...' : editingId ? 'Zapisz' : 'Dodaj'}
              </Button>
            </div>
          </form>
        )}

        {/* Contacts List */}
        {contacts.length === 0 && !showForm ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Brak osób kontaktowych</p>
            {!readOnly && (
              <Button size="sm" variant="outline" onClick={openAddForm} className="mt-3">
                <Plus className="mr-1 h-4 w-4" />
                Dodaj pierwszą osobę
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="p-3 bg-white dark:bg-black/20 rounded-xl transition-all hover:shadow-md">
                {/* Row 1: Avatar + Name + Menu */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow">
                    {contact.firstName?.charAt(0)}{contact.lastName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">
                      {contact.firstName} {contact.lastName}
                    </p>
                    {contact.role && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Briefcase className="h-3 w-3 shrink-0" />
                        {contact.role}
                      </p>
                    )}
                  </div>
                  {/* Dropdown menu - takes minimal space */}
                  {!readOnly && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleTogglePrimary(contact)}>
                          <Star className={`mr-2 h-4 w-4 ${contact.isPrimary ? 'text-amber-500 fill-amber-500' : ''}`} />
                          {contact.isPrimary ? 'Usuń z głównych' : 'Ustaw jako główny'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditForm(contact)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edytuj
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          disabled={deletingId === contact.id}
                          onClick={() => handleDelete(contact.id, `${contact.firstName} ${contact.lastName}`)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Usuń
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Row 2: Primary badge */}
                {contact.isPrimary && (
                  <div className="mt-2 pl-12">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 text-xs">
                      <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                      Główny kontakt
                    </Badge>
                  </div>
                )}

                {/* Row 3: Contact details */}
                {(contact.email || contact.phone) && (
                  <div className="mt-2 pl-12 space-y-1">
                    {contact.email && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="break-all">{contact.email}</span>
                      </p>
                    )}
                    {contact.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span>{contact.phone}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      {ConfirmDialog}
    </GradientCard>
  )
}

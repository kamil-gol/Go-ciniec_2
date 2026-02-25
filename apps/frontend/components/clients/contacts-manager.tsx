'use client'

import { useState } from 'react'
import {
  Users, User, Mail, Phone, Star, StarOff, Plus, Pencil, Trash2, X, Save, Briefcase,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  addClientContact,
  updateClientContact,
  removeClientContact,
  type ClientContact,
  type CreateClientContactInput,
} from '@/lib/api/clients'

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
  const { toast } = useToast()
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
      role: (contact as any).role || '',
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
      toast({
        title: 'Błąd walidacji',
        description: 'Imię i nazwisko są wymagane',
        variant: 'destructive',
      })
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
        toast({
          title: 'Sukces',
          description: 'Osoba kontaktowa została zaktualizowana',
        })
      } else {
        await addClientContact(clientId, payload)
        toast({
          title: 'Sukces',
          description: 'Osoba kontaktowa została dodana',
        })
      }

      closeForm()
      onUpdate()
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Wystąpił błąd'
      toast({
        title: 'Błąd',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (contactId: string, contactName: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć osobę kontaktową ${contactName}?`)) return

    try {
      setDeletingId(contactId)
      await removeClientContact(clientId, contactId)
      toast({
        title: 'Sukces',
        description: `Usunięto osobę kontaktową: ${contactName}`,
      })
      onUpdate()
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Nie udało się usunąć kontaktu'
      toast({
        title: 'Błąd',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleTogglePrimary = async (contact: ClientContact) => {
    try {
      await updateClientContact(clientId, contact.id, {
        isPrimary: !contact.isPrimary,
      })
      toast({
        title: 'Sukces',
        description: contact.isPrimary
          ? `${contact.firstName} ${contact.lastName} nie jest już główną osobą kontaktową`
          : `${contact.firstName} ${contact.lastName} ustawiony jako główna osoba kontaktowa`,
      })
      onUpdate()
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się zmienić statusu kontaktu',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30 rounded-2xl border-0 shadow-xl overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">Osoby kontaktowe</h2>
            <span className="text-sm text-muted-foreground">({contacts.length})</span>
          </div>
          {!readOnly && !showForm && (
            <Button
              size="sm"
              onClick={openAddForm}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md"
            >
              <Plus className="mr-1 h-4 w-4" />
              Dodaj
            </Button>
          )}
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white dark:bg-black/20 rounded-xl border-2 border-amber-200 dark:border-amber-800/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-amber-700 dark:text-amber-400">
                {editingId ? 'Edytuj osobę kontaktową' : 'Nowa osoba kontaktowa'}
              </h3>
              <Button type="button" variant="ghost" size="sm" onClick={closeForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="contact-firstName" className="text-sm font-medium">
                  Imię <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contact-firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Jan"
                  required
                  className="h-10 border-2"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-lastName" className="text-sm font-medium">
                  Nazwisko <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contact-lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Kowalski"
                  required
                  className="h-10 border-2"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="contact-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jan@firma.pl"
                  className="h-10 border-2"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-phone" className="text-sm font-medium">Telefon</Label>
                <Input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+48 123 456 789"
                  className="h-10 border-2"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-role" className="text-sm font-medium">Stanowisko</Label>
                <Input
                  id="contact-role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="np. Dyrektor, Księgowa"
                  className="h-10 border-2"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
                    className="w-4 h-4 rounded border-2 border-amber-400 text-amber-500 focus:ring-amber-500"
                  />
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Główna osoba kontaktowa</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeForm} className="flex-1" disabled={loading}>
                <X className="mr-1 h-4 w-4" />
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                <Save className="mr-1 h-4 w-4" />
                {loading ? 'Zapisywanie...' : editingId ? 'Zapisz zmiany' : 'Dodaj kontakt'}
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
              <div
                key={contact.id}
                className="group p-4 bg-white dark:bg-black/20 rounded-xl space-y-2 transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {contact.firstName?.charAt(0)}{contact.lastName?.charAt(0)}
                    </div>
                    <span className="font-semibold text-base truncate">
                      {contact.firstName} {contact.lastName}
                    </span>
                    {contact.isPrimary && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                        <Star className="h-3 w-3" />
                        Główny
                      </span>
                    )}
                    {(contact as any).role && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 shrink-0">
                        <Briefcase className="h-3 w-3" />
                        {(contact as any).role}
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  {!readOnly && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePrimary(contact)}
                        title={contact.isPrimary ? 'Usuń jako główny' : 'Ustaw jako główny'}
                        className="h-8 w-8 p-0"
                      >
                        {contact.isPrimary ? (
                          <StarOff className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Star className="h-4 w-4 text-neutral-400 hover:text-amber-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditForm(contact)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4 text-neutral-500 hover:text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === contact.id}
                        onClick={() => handleDelete(contact.id, `${contact.firstName} ${contact.lastName}`)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-neutral-500 hover:text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Contact details row */}
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground pl-10">
                  {contact.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

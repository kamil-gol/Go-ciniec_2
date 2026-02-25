// apps/frontend/src/components/clients/ContactsDialog.tsx
'use client';

import { useState } from 'react';
import {
  Star,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  UserPlus,
} from 'lucide-react';
import {
  useAddContact,
  useUpdateContact,
  useRemoveContact,
  useClient,
} from '@/hooks/use-clients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { Client, ClientContact, CreateClientContactInput } from '@/types/client.types';

interface ContactsDialogProps {
  client: Client;
  open: boolean;
  onClose: () => void;
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isPrimary: boolean;
}

const emptyForm: ContactFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: '',
  isPrimary: false,
};

export function ContactsDialog({ client, open, onClose }: ContactsDialogProps) {
  const { toast } = useToast();
  const { data: freshClient } = useClient(client.id);
  const contacts = freshClient?.contacts || client.contacts || [];

  const addContact = useAddContact();
  const updateContact = useUpdateContact();
  const removeContact = useRemoveContact();

  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<ClientContact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientContact | null>(null);
  const [form, setForm] = useState<ContactFormData>(emptyForm);

  const isPending =
    addContact.isPending || updateContact.isPending || removeContact.isPending;

  // ── Open form for new contact ──────────────────────────
  const handleAdd = () => {
    setEditingContact(null);
    setForm({ ...emptyForm, isPrimary: contacts.length === 0 });
    setShowForm(true);
  };

  // ── Open form for editing ──────────────────────────────
  const handleEdit = (contact: ClientContact) => {
    setEditingContact(contact);
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || '',
      phone: contact.phone || '',
      role: contact.role || '',
      isPrimary: contact.isPrimary,
    });
    setShowForm(true);
  };

  // ── Cancel form ───────────────────────────────────────
  const handleCancel = () => {
    setShowForm(false);
    setEditingContact(null);
    setForm(emptyForm);
  };

  // ── Save (create or update) ────────────────────────────
  const handleSave = async () => {
    if (!form.firstName || !form.lastName) {
      toast({
        title: 'Błąd',
        description: 'Imię i nazwisko są wymagane.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingContact) {
        await updateContact.mutateAsync({
          clientId: client.id,
          contactId: editingContact.id,
          data: {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email || null,
            phone: form.phone || null,
            role: form.role || null,
            isPrimary: form.isPrimary,
          },
        });
        toast({ title: 'Kontakt zaktualizowany' });
      } else {
        await addContact.mutateAsync({
          clientId: client.id,
          data: {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email || undefined,
            phone: form.phone || undefined,
            role: form.role || undefined,
            isPrimary: form.isPrimary,
          },
        });
        toast({ title: 'Kontakt dodany' });
      }
      handleCancel();
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description:
          error?.response?.data?.error || 'Nie udało się zapisać kontaktu.',
        variant: 'destructive',
      });
    }
  };

  // ── Set as primary ────────────────────────────────────
  const handleSetPrimary = async (contact: ClientContact) => {
    try {
      await updateContact.mutateAsync({
        clientId: client.id,
        contactId: contact.id,
        data: { isPrimary: true },
      });
      toast({ title: `${contact.firstName} ustawiony jako główny kontakt` });
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error?.response?.data?.error || 'Nie udało się zmienić.',
        variant: 'destructive',
      });
    }
  };

  // ── Delete ───────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeContact.mutateAsync({
        clientId: client.id,
        contactId: deleteTarget.id,
      });
      toast({ title: 'Kontakt usunięty' });
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error?.response?.data?.error || 'Nie udało się usunąć.',
        variant: 'destructive',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Osoby kontaktowe — {client.companyName || `${client.firstName} ${client.lastName}`}
            </DialogTitle>
          </DialogHeader>

          {/* Contact List */}
          <div className="space-y-3">
            {contacts.length === 0 && !showForm && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Brak osób kontaktowych. Dodaj pierwszą osobę.
              </p>
            )}

            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {contact.firstName} {contact.lastName}
                    </span>
                    {contact.isPrimary && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                        <Star className="mr-1 h-3 w-3" />
                        Główny
                      </Badge>
                    )}
                    {contact.role && (
                      <span className="text-sm text-muted-foreground">
                        ({contact.role})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {contact.email && <span>{contact.email}</span>}
                    {contact.phone && <span>{contact.phone}</span>}
                  </div>
                </div>

                <div className="flex gap-1">
                  {!contact.isPrimary && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSetPrimary(contact)}
                      title="Ustaw jako główny"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(contact)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(contact)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Inline Add/Edit Form */}
            {showForm && (
              <div className="rounded-md border-2 border-primary/20 bg-muted/30 p-4 space-y-3">
                <h4 className="text-sm font-medium">
                  {editingContact ? 'Edytuj kontakt' : 'Nowy kontakt'}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Imię *</Label>
                    <Input
                      value={form.firstName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, firstName: e.target.value }))
                      }
                      placeholder="Anna"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Nazwisko *</Label>
                    <Input
                      value={form.lastName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, lastName: e.target.value }))
                      }
                      placeholder="Nowak"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      placeholder="anna@firma.pl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Telefon</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      placeholder="+48 500 600 700"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Stanowisko</Label>
                    <Input
                      value={form.role}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, role: e.target.value }))
                      }
                      placeholder="HR Manager"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isPrimary}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, isPrimary: e.target.checked }))
                        }
                        className="rounded"
                      />
                      Główna osoba kontaktowa
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Anuluj
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="mr-1 h-3 w-3" />
                    )}
                    {editingContact ? 'Zapisz' : 'Dodaj'}
                  </Button>
                </div>
              </div>
            )}

            {/* Add button */}
            {!showForm && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAdd}
              >
                <Plus className="mr-2 h-4 w-4" />
                Dodaj osobę kontaktową
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć kontakt?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>Czy na pewno chcesz usunąć {deleteTarget.firstName} {deleteTarget.lastName}?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

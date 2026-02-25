// apps/frontend/src/components/clients/ClientForm.tsx
'use client';

import { useState } from 'react';
import { Loader2, Building2, User, Plus, X } from 'lucide-react';
import { useCreateClient, useUpdateClient } from '@/hooks/use-clients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type {
  Client,
  ClientType,
  CreateClientInput,
  CreateClientContactInput,
} from '@/types/client.types';

interface ClientFormProps {
  client: Client | null;
  onClose: () => void;
}

export function ClientForm({ client, onClose }: ClientFormProps) {
  const isEditing = !!client;
  const { toast } = useToast();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  // ── Form state ────────────────────────────────────────
  const [clientType, setClientType] = useState<ClientType>(
    client?.clientType || 'INDIVIDUAL'
  );

  // Basic fields
  const [firstName, setFirstName] = useState(client?.firstName || '');
  const [lastName, setLastName] = useState(client?.lastName || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [email, setEmail] = useState(client?.email || '');
  const [notes, setNotes] = useState(client?.notes || '');

  // Company fields
  const [companyName, setCompanyName] = useState(client?.companyName || '');
  const [nip, setNip] = useState(client?.nip || '');
  const [regon, setRegon] = useState(client?.regon || '');
  const [companyEmail, setCompanyEmail] = useState(client?.companyEmail || '');
  const [companyPhone, setCompanyPhone] = useState(client?.companyPhone || '');
  const [companyAddress, setCompanyAddress] = useState(client?.companyAddress || '');
  const [companyCity, setCompanyCity] = useState(client?.companyCity || '');
  const [companyPostalCode, setCompanyPostalCode] = useState(client?.companyPostalCode || '');
  const [industry, setIndustry] = useState(client?.industry || '');
  const [website, setWebsite] = useState(client?.website || '');

  // Inline contacts (only for creation)
  const [inlineContacts, setInlineContacts] = useState<CreateClientContactInput[]>([]);

  const isPending = createClient.isPending || updateClient.isPending;

  // ── Inline contact helpers ─────────────────────────────
  const addInlineContact = () => {
    setInlineContacts((prev) => [
      ...prev,
      { firstName: '', lastName: '', role: '', isPrimary: prev.length === 0 },
    ]);
  };

  const removeInlineContact = (index: number) => {
    setInlineContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateInlineContact = (
    index: number,
    field: keyof CreateClientContactInput,
    value: string | boolean
  ) => {
    setInlineContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  // ── Submit ────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing) {
        await updateClient.mutateAsync({
          id: client.id,
          data: {
            clientType,
            firstName,
            lastName,
            phone,
            email: email || null,
            notes: notes || null,
            ...(clientType === 'COMPANY'
              ? {
                  companyName: companyName || null,
                  nip: nip || null,
                  regon: regon || null,
                  companyEmail: companyEmail || null,
                  companyPhone: companyPhone || null,
                  companyAddress: companyAddress || null,
                  companyCity: companyCity || null,
                  companyPostalCode: companyPostalCode || null,
                  industry: industry || null,
                  website: website || null,
                }
              : {
                  companyName: null,
                  nip: null,
                  regon: null,
                  companyEmail: null,
                  companyPhone: null,
                  companyAddress: null,
                  companyCity: null,
                  companyPostalCode: null,
                  industry: null,
                  website: null,
                }),
          },
        });
        toast({ title: 'Klient zaktualizowany' });
      } else {
        const payload: CreateClientInput = {
          clientType,
          firstName,
          lastName,
          phone,
          email: email || undefined,
          notes: notes || undefined,
        };

        if (clientType === 'COMPANY') {
          payload.companyName = companyName;
          payload.nip = nip || undefined;
          payload.regon = regon || undefined;
          payload.companyEmail = companyEmail || undefined;
          payload.companyPhone = companyPhone || undefined;
          payload.companyAddress = companyAddress || undefined;
          payload.companyCity = companyCity || undefined;
          payload.companyPostalCode = companyPostalCode || undefined;
          payload.industry = industry || undefined;
          payload.website = website || undefined;

          const validContacts = inlineContacts.filter(
            (c) => c.firstName && c.lastName
          );
          if (validContacts.length > 0) {
            payload.contacts = validContacts;
          }
        }

        await createClient.mutateAsync(payload);
        toast({ title: 'Klient utworzony' });
      }
      onClose();
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description:
          error?.response?.data?.error || 'Nie udało się zapisać klienta.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type Toggle */}
      {!isEditing && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant={clientType === 'INDIVIDUAL' ? 'default' : 'outline'}
            onClick={() => setClientType('INDIVIDUAL')}
            className="flex-1"
          >
            <User className="mr-2 h-4 w-4" />
            Osoba prywatna
          </Button>
          <Button
            type="button"
            variant={clientType === 'COMPANY' ? 'default' : 'outline'}
            onClick={() => setClientType('COMPANY')}
            className="flex-1"
          >
            <Building2 className="mr-2 h-4 w-4" />
            Firma
          </Button>
        </div>
      )}

      {/* Company Fields (only for COMPANY) */}
      {clientType === 'COMPANY' && (
        <>
          <Separator />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Dane firmy
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="companyName">Nazwa firmy *</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="np. Budimex S.A."
                required={clientType === 'COMPANY'}
              />
            </div>
            <div>
              <Label htmlFor="nip">NIP</Label>
              <Input
                id="nip"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="np. 5261003187"
                maxLength={13}
              />
            </div>
            <div>
              <Label htmlFor="regon">REGON</Label>
              <Input
                id="regon"
                value={regon}
                onChange={(e) => setRegon(e.target.value)}
                placeholder="np. 010732370"
              />
            </div>
            <div>
              <Label htmlFor="industry">Branża</Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="np. Budownictwo"
              />
            </div>
            <div>
              <Label htmlFor="website">Strona www</Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="np. https://budimex.pl"
              />
            </div>
            <div>
              <Label htmlFor="companyEmail">Email firmy</Label>
              <Input
                id="companyEmail"
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="biuro@firma.pl"
              />
            </div>
            <div>
              <Label htmlFor="companyPhone">Telefon firmy</Label>
              <Input
                id="companyPhone"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                placeholder="+48 22 123 45 67"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="companyAddress">Adres</Label>
              <Input
                id="companyAddress"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="ul. Stawki 40"
              />
            </div>
            <div>
              <Label htmlFor="companyCity">Miasto</Label>
              <Input
                id="companyCity"
                value={companyCity}
                onChange={(e) => setCompanyCity(e.target.value)}
                placeholder="Warszawa"
              />
            </div>
            <div>
              <Label htmlFor="companyPostalCode">Kod pocztowy</Label>
              <Input
                id="companyPostalCode"
                value={companyPostalCode}
                onChange={(e) => setCompanyPostalCode(e.target.value)}
                placeholder="01-040"
              />
            </div>
          </div>
        </>
      )}

      {/* Person Fields */}
      <Separator />
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {clientType === 'COMPANY' ? 'Osoba zgłaszająca' : 'Dane osobowe'}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Imię *</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Nazwisko *</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Telefon *</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+48 500 600 700"
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jan@example.com"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notatki</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Dodatkowe informacje o kliencie..."
          rows={3}
        />
      </div>

      {/* Inline Contacts (only for COMPANY creation) */}
      {clientType === 'COMPANY' && !isEditing && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Osoby kontaktowe
            </h3>
            <Button type="button" variant="outline" size="sm" onClick={addInlineContact}>
              <Plus className="mr-1 h-3 w-3" />
              Dodaj
            </Button>
          </div>

          {inlineContacts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Możesz dodać osoby kontaktowe teraz lub później.
            </p>
          )}

          {inlineContacts.map((contact, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end rounded-md border p-3"
            >
              <div>
                <Label className="text-xs">Imię</Label>
                <Input
                  value={contact.firstName}
                  onChange={(e) =>
                    updateInlineContact(index, 'firstName', e.target.value)
                  }
                  placeholder="Anna"
                />
              </div>
              <div>
                <Label className="text-xs">Nazwisko</Label>
                <Input
                  value={contact.lastName}
                  onChange={(e) =>
                    updateInlineContact(index, 'lastName', e.target.value)
                  }
                  placeholder="Nowak"
                />
              </div>
              <div>
                <Label className="text-xs">Stanowisko</Label>
                <Input
                  value={contact.role || ''}
                  onChange={(e) =>
                    updateInlineContact(index, 'role', e.target.value)
                  }
                  placeholder="HR Manager"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeInlineContact(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Anuluj
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Zapisz zmiany' : 'Utwórz klienta'}
        </Button>
      </div>
    </form>
  );
}

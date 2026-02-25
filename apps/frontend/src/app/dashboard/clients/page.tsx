// apps/frontend/src/app/dashboard/clients/page.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  Building2,
  User,
  Plus,
  Search,
  Loader2,
  Phone,
  Mail,
  Star,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useClients, useDeleteClient } from '@/hooks/use-clients';
import { ClientForm } from '@/components/clients/ClientForm';
import { ContactsDialog } from '@/components/clients/ContactsDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import type { Client, ClientType } from '@/types/client.types';
import { CLIENT_TYPE_LABELS, CLIENT_TYPE_COLORS } from '@/types/client.types';

export default function ClientsPage() {
  // ── State ───────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'all' | 'individual' | 'company'>('all');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [contactsClient, setContactsClient] = useState<Client | null>(null);

  const { toast } = useToast();

  // ── Determine filter by tab ───────────────────────────────
  const clientTypeFilter: ClientType | undefined =
    activeTab === 'individual'
      ? 'INDIVIDUAL'
      : activeTab === 'company'
        ? 'COMPANY'
        : undefined;

  const { data: clients, isLoading } = useClients({
    search: search || undefined,
    clientType: clientTypeFilter,
  });

  const deleteClient = useDeleteClient();

  // ── Counts per type ───────────────────────────────────
  const { data: allClients } = useClients();
  const counts = useMemo(() => {
    if (!allClients) return { all: 0, individual: 0, company: 0 };
    return {
      all: allClients.length,
      individual: allClients.filter((c) => c.clientType === 'INDIVIDUAL').length,
      company: allClients.filter((c) => c.clientType === 'COMPANY').length,
    };
  }, [allClients]);

  // ── Handlers ───────────────────────────────────────────
  const handleCreate = () => {
    setEditingClient(null);
    setFormOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingClient(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteClient.mutateAsync(deleteTarget.id);
      toast({
        title: 'Klient usunięty',
        description: `${deleteTarget.firstName} ${deleteTarget.lastName} został usunięty.`,
      });
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error?.response?.data?.error || 'Nie udało się usunąć klienta.',
        variant: 'destructive',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleManageContacts = (client: Client) => {
    setContactsClient(client);
  };

  // ── Helpers ────────────────────────────────────────────
  const getDisplayName = (client: Client) => {
    if (client.clientType === 'COMPANY' && client.companyName) {
      return client.companyName;
    }
    return `${client.firstName} ${client.lastName}`;
  };

  const getSubline = (client: Client) => {
    if (client.clientType === 'COMPANY') {
      return `${client.firstName} ${client.lastName}${client.nip ? ` • NIP: ${client.nip}` : ''}`;
    }
    return client.email || null;
  };

  const getPrimaryContact = (client: Client) => {
    return client.contacts?.find((c) => c.isPrimary) || client.contacts?.[0] || null;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            Klienci
          </h1>
          <p className="text-muted-foreground">
            Zarządzanie klientami indywidualnymi i firmowymi
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nowy klient
        </Button>
      </div>

      {/* Tabs + Search */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Wszyscy
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                {counts.all}
              </span>
            </TabsTrigger>
            <TabsTrigger value="individual" className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              Osoby prywatne
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                {counts.individual}
              </span>
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              Firmy
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                {counts.company}
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj po nazwie, NIP, telefonie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table (shared for all tabs) */}
        {['all', 'individual', 'company'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : clients && clients.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[280px]">Klient</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Kontakt główny</TableHead>
                      <TableHead className="text-right">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => {
                      const primaryContact = getPrimaryContact(client);
                      return (
                        <TableRow key={client.id}>
                          {/* Name */}
                          <TableCell>
                            <div>
                              <div className="font-medium">{getDisplayName(client)}</div>
                              {getSubline(client) && (
                                <div className="text-sm text-muted-foreground">
                                  {getSubline(client)}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* Type Badge */}
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={CLIENT_TYPE_COLORS[client.clientType]}
                            >
                              {client.clientType === 'COMPANY' ? (
                                <Building2 className="mr-1 h-3 w-3" />
                              ) : (
                                <User className="mr-1 h-3 w-3" />
                              )}
                              {CLIENT_TYPE_LABELS[client.clientType]}
                            </Badge>
                          </TableCell>

                          {/* Phone */}
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {client.phone}
                            </div>
                          </TableCell>

                          {/* Email */}
                          <TableCell>
                            {client.email ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {client.email}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>

                          {/* Primary Contact (COMPANY only) */}
                          <TableCell>
                            {client.clientType === 'COMPANY' && primaryContact ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-sm">
                                      <Star className="h-3 w-3 text-yellow-500" />
                                      {primaryContact.firstName} {primaryContact.lastName}
                                      {primaryContact.role && (
                                        <span className="text-muted-foreground">
                                          ({primaryContact.role})
                                        </span>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Główna osoba kontaktowa</p>
                                    {primaryContact.email && <p>{primaryContact.email}</p>}
                                    {primaryContact.phone && <p>{primaryContact.phone}</p>}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : client.clientType === 'COMPANY' ? (
                              <span className="text-sm text-muted-foreground">Brak</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(client)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edytuj
                                </DropdownMenuItem>
                                {client.clientType === 'COMPANY' && (
                                  <DropdownMenuItem
                                    onClick={() => handleManageContacts(client)}
                                  >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Osoby kontaktowe ({client.contacts?.length || 0})
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => setDeleteTarget(client)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Usuń
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                <Users className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">
                  {search ? 'Brak wyników' : 'Brak klientów'}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {search
                    ? `Nie znaleziono klientów dla "${search}"`
                    : 'Utwórz pierwszego klienta'}
                </p>
                {!search && (
                  <Button onClick={handleCreate} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Nowy klient
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog: Client Form */}
      <Dialog open={formOpen} onOpenChange={handleFormClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Edytuj klienta' : 'Nowy klient'}
            </DialogTitle>
          </DialogHeader>
          <ClientForm client={editingClient} onClose={handleFormClose} />
        </DialogContent>
      </Dialog>

      {/* Dialog: Contacts Management */}
      {contactsClient && (
        <ContactsDialog
          client={contactsClient}
          open={!!contactsClient}
          onClose={() => setContactsClient(null)}
        />
      )}

      {/* Alert: Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć klienta?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  Czy na pewno chcesz usunąć klienta{' '}
                  <strong>
                    {deleteTarget.clientType === 'COMPANY'
                      ? deleteTarget.companyName
                      : `${deleteTarget.firstName} ${deleteTarget.lastName}`}
                  </strong>
                  ? Dane zostaną zanonimizowane (soft-delete).
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteClient.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

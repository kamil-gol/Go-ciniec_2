'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, PackagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PageLayout, PageHero, EmptyState } from '@/components/shared';
import { moduleAccents } from '@/lib/design-tokens';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AddonGroup {
  id: string;
  name: string;
  description: string | null;
  minSelect: number;
  maxSelect: number;
  priceType: string;
  basePrice: string;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  addons: any[];
}

export default function AddonGroupsPage() {
  const [groups, setGroups] = useState<AddonGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AddonGroup>>({});
  const { toast } = useToast();
  const accent = moduleAccents.menu;

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${API_URL}/api/addon-groups`);
      const data = await res.json();
      if (data.success) {
        setGroups(data.data);
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się pobrać grup dodatków',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingId('new');
    setFormData({
      name: '',
      description: '',
      minSelect: 0,
      maxSelect: 1,
      priceType: 'PER_ITEM',
      basePrice: '0',
      icon: '',
      displayOrder: 0,
      isActive: true,
    });
  };

  const handleEdit = (group: AddonGroup) => {
    setEditingId(group.id);
    setFormData(group);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleSave = async () => {
    try {
      const url = editingId === 'new'
        ? `${API_URL}/api/addon-groups`
        : `${API_URL}/api/addon-groups/${editingId}`;

      const method = editingId === 'new' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Sukces',
          description: data.message || 'Grupa dodatków została zapisana',
        });
        fetchGroups();
        handleCancel();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error.message || 'Nie udało się zapisać grupy dodatków',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę grupę dodatków?')) return;

    try {
      const res = await fetch(`${API_URL}/api/addon-groups/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Sukces',
          description: 'Grupa dodatków została usunięta',
        });
        fetchGroups();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error.message || 'Nie udało się usunąć grupy dodatków',
        variant: 'destructive',
      });
    }
  };

  return (
    <PageLayout>
      <PageHero
        accent={accent}
        title="Grupy dodatków"
        subtitle="Zarządzaj grupami dodatków do pakietów menu"
        icon={PackagePlus}
        backHref="/dashboard/menu"
        backLabel="Powrót do Menu"
        action={
          <Button onClick={handleCreate} className="bg-white text-blue-600 hover:bg-white/90 shadow-xl">
            <Plus className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Dodaj grupę</span>
          </Button>
        }
      />

      {editingId && (
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            {editingId === 'new' ? 'Nowa grupa dodatków' : 'Edytuj grupę dodatków'}
          </h2>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nazwa grupy *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="np. Alkohol - Drinki Premium"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Krótki opis grupy dodatków"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minSelect">Min wybór</Label>
                <Input
                  id="minSelect"
                  type="number"
                  min="0"
                  value={formData.minSelect || 0}
                  onChange={(e) => setFormData({ ...formData, minSelect: parseInt(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxSelect">Max wybór</Label>
                <Input
                  id="maxSelect"
                  type="number"
                  min="1"
                  value={formData.maxSelect || 1}
                  onChange={(e) => setFormData({ ...formData, maxSelect: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priceType">Typ ceny *</Label>
                <Select
                  value={formData.priceType || 'PER_ITEM'}
                  onValueChange={(value) => setFormData({ ...formData, priceType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Gratis</SelectItem>
                    <SelectItem value="PER_ITEM">Za sztukę</SelectItem>
                    <SelectItem value="PER_GROUP">Za grupę</SelectItem>
                    <SelectItem value="PER_PERSON">Za osobę</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="basePrice">Cena bazowa (zł)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.basePrice || '0'}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="icon">Ikona</Label>
                <Input
                  id="icon"
                  value={formData.icon || ''}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="np. cocktail, wine"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="displayOrder">Kolejność</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min="0"
                  value={formData.displayOrder || 0}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive ?? true}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Aktywna</Label>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleSave} disabled={!formData.name} className="sm:w-auto">
                <Save className="mr-2 h-4 w-4" /> Zapisz
              </Button>
              <Button variant="outline" onClick={handleCancel} className="sm:w-auto">
                <X className="mr-2 h-4 w-4" /> Anuluj
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-3 sm:gap-4">
        {!loading && groups.length === 0 ? (
          <EmptyState
            icon={PackagePlus}
            title="Brak grup dodatków"
            description='Kliknij "Dodaj grupę" aby utworzyć pierwszą.'
            actionLabel="Dodaj grupę"
            onAction={handleCreate}
          />
        ) : (
          groups.map((group) => (
            <Card key={group.id} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold truncate">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm text-muted-foreground">
                    <span>Wybór: {group.minSelect}-{group.maxSelect}</span>
                    <span>Typ: {group.priceType}</span>
                    <span>Cena: {group.basePrice} zł</span>
                    <span className={group.isActive ? 'text-green-600' : 'text-red-600'}>
                      {group.isActive ? 'Aktywna' : 'Nieaktywna'}
                    </span>
                  </div>
                  {group.addons.length > 0 && (
                    <div className="mt-2 text-xs sm:text-sm">Dania: {group.addons.length}</div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(group)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(group.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </PageLayout>
  );
}

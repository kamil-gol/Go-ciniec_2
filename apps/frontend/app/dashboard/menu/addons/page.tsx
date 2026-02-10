'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
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

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/addon-groups');
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
        ? '/api/addon-groups' 
        : `/api/addon-groups/${editingId}`;
      
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
      const res = await fetch(`/api/addon-groups/${id}`, {
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

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grupy dodatków</h1>
          <p className="text-muted-foreground mt-2">
            Zarządzaj grupami dodatków do pakietów menu
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj grupę
        </Button>
      </div>

      {editingId && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="isActive" className="cursor-pointer">
                Aktywna
              </Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!formData.name}>
                <Save className="mr-2 h-4 w-4" />
                Zapisz
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Anuluj
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {groups.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Brak grup dodatków. Kliknij "Dodaj grupę" aby utworzyć pierwszą.
          </Card>
        ) : (
          groups.map((group) => (
            <Card key={group.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {group.description}
                    </p>
                  )}
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Wybór: {group.minSelect}-{group.maxSelect}</span>
                    <span>Typ: {group.priceType}</span>
                    <span>Cena: {group.basePrice} zł</span>
                    <span className={group.isActive ? 'text-green-600' : 'text-red-600'}>
                      {group.isActive ? 'Aktywna' : 'Nieaktywna'}
                    </span>
                  </div>
                  {group.addons.length > 0 && (
                    <div className="mt-2 text-sm">
                      Dania: {group.addons.length}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(group)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(group.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

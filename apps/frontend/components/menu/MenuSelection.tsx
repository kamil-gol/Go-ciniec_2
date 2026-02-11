'use client';

import { useState, useEffect } from 'react';
import { MenuTemplate, MenuPackage, MenuOption, GuestCounts } from '@/types/menu.types';
import { getMenuTemplates, getMenuOptions, selectReservationMenu, calculateMenuPrice } from '@/services/menu-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, Users, UtensilsCrossed } from 'lucide-react';

interface MenuSelectionProps {
  reservationId: string;
  eventTypeId: string;
  initialGuestCount?: number;
  onMenuSelected?: () => void;
}

export default function MenuSelection({ 
  reservationId, 
  eventTypeId, 
  initialGuestCount = 50,
  onMenuSelected 
}: MenuSelectionProps) {
  const { toast } = useToast();
  
  // State
  const [templates, setTemplates] = useState<MenuTemplate[]>([]);
  const [options, setOptions] = useState<MenuOption[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MenuTemplate | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<MenuPackage | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [guestCounts, setGuestCounts] = useState<GuestCounts>({
    adults: initialGuestCount,
    children: 0,
    toddlers: 0,
  });
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Load templates and options
  useEffect(() => {
    loadData();
  }, [eventTypeId]);

  // Calculate price when selection changes
  useEffect(() => {
    if (selectedPackage && guestCounts.adults > 0) {
      calculatePrice();
    }
  }, [selectedPackage, selectedOptions, guestCounts]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, optionsData] = await Promise.all([
        getMenuTemplates(eventTypeId),
        getMenuOptions(),
      ]);
      
      setTemplates(templatesData);
      setOptions(optionsData.filter(opt => opt.isActive));
      
      // Auto-select first template with packages
      const firstTemplateWithPackages = templatesData.find(t => t.packages && t.packages.length > 0);
      if (firstTemplateWithPackages) {
        setSelectedTemplate(firstTemplateWithPackages);
      }
    } catch (error) {
      console.error('Error loading menu data:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się załadować danych menu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = async () => {
    if (!selectedPackage) return;
    
    try {
      setCalculating(true);
      const calculation = await calculateMenuPrice(
        selectedPackage.id,
        guestCounts,
        selectedOptions
      );
      setTotalPrice(calculation.totalCost);
    } catch (error) {
      console.error('Error calculating price:', error);
    } finally {
      setCalculating(false);
    }
  };

  const handleSaveMenu = async () => {
    if (!selectedPackage) {
      toast({
        title: 'Błąd',
        description: 'Wybierz pakiet menu',
        variant: 'destructive',
      });
      return;
    }

    if (guestCounts.adults === 0) {
      toast({
        title: 'Błąd',
        description: 'Podaj liczbę dorosłych gości',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      await selectReservationMenu(reservationId, {
        packageId: selectedPackage.id,
        selectedOptions,
        guestCounts,
      });
      
      toast({
        title: 'Sukces',
        description: 'Menu zostało zapisane',
      });
      
      if (onMenuSelected) {
        onMenuSelected();
      }
    } catch (error: any) {
      console.error('Error saving menu:', error);
      toast({
        title: 'Błąd',
        description: error.response?.data?.error || 'Nie udało się zapisać menu',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Brak dostępnych menu</h3>
            <p className="text-muted-foreground">Nie znaleziono menu dla tego typu wydarzenia</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      {templates.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Wybierz szablon menu</CardTitle>
            <CardDescription>Dostępne warianty menu dla Twojego wydarzenia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-4 border-2 rounded-lg text-left transition-all hover:border-primary ${
                    selectedTemplate?.id === template.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <h4 className="font-semibold mb-1">{template.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                  <Badge variant="secondary">{template.packages.length} pakietów</Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guest Counts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liczba gości
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adults">Dorośli</Label>
              <Input
                id="adults"
                type="number"
                min="1"
                value={guestCounts.adults}
                onChange={(e) => setGuestCounts(prev => ({ ...prev, adults: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="children">Dzieci (4-12 lat)</Label>
              <Input
                id="children"
                type="number"
                min="0"
                value={guestCounts.children}
                onChange={(e) => setGuestCounts(prev => ({ ...prev, children: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toddlers">Małe dzieci (0-3 lata)</Label>
              <Input
                id="toddlers"
                type="number"
                min="0"
                value={guestCounts.toddlers}
                onChange={(e) => setGuestCounts(prev => ({ ...prev, toddlers: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Selection */}
      {selectedTemplate && selectedTemplate.packages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Wybierz pakiet</CardTitle>
            <CardDescription>{selectedTemplate.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedTemplate.packages.map(pkg => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-4 border-2 rounded-lg text-left transition-all hover:border-primary relative ${
                    selectedPackage?.id === pkg.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                  style={{ borderColor: selectedPackage?.id === pkg.id ? pkg.color : undefined }}
                >
                  {pkg.isPopular && (
                    <Badge className="absolute top-2 right-2" variant="default">Popularne</Badge>
                  )}
                  {pkg.isRecommended && (
                    <Badge className="absolute top-2 right-2" variant="secondary">Polecane</Badge>
                  )}
                  <div className="text-3xl mb-2">{pkg.icon || '🍽️'}</div>
                  <h4 className="font-semibold mb-1">{pkg.name}</h4>
                  {pkg.shortDescription && (
                    <p className="text-sm text-muted-foreground mb-3">{pkg.shortDescription}</p>
                  )}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dorośli:</span>
                      <span className="font-semibold">{pkg.pricePerAdult} zł</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dzieci:</span>
                      <span className="font-semibold">{pkg.pricePerChild} zł</span>
                    </div>
                  </div>
                  {selectedPackage?.id === pkg.id && (
                    <div className="mt-3 flex items-center gap-2 text-primary">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Wybrano</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Options Selection */}
      {selectedPackage && options.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dodatki</CardTitle>
            <CardDescription>Opcjonalne dodatki do menu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['CULINARY', 'BEVERAGES', 'DECORATIONS', 'ENTERTAINMENT', 'SERVICES'].map(category => {
                const categoryOptions = options.filter(opt => opt.category === category);
                if (categoryOptions.length === 0) return null;
                
                const categoryNames: Record<string, string> = {
                  CULINARY: 'Kulinaria',
                  BEVERAGES: 'Napoje',
                  DECORATIONS: 'Dekoracje',
                  ENTERTAINMENT: 'Rozrywka',
                  SERVICES: 'Usługi',
                };

                return (
                  <div key={category}>
                    <h4 className="font-semibold mb-3">{categoryNames[category]}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryOptions.map(option => (
                        <div
                          key={option.id}
                          className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <Checkbox
                            id={option.id}
                            checked={selectedOptions.includes(option.id)}
                            onCheckedChange={() => toggleOption(option.id)}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={option.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {option.icon} {option.name}
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                              {option.shortDescription || option.description}
                            </p>
                            <p className="text-sm font-semibold mt-1">
                              {option.priceType === 'FLAT_FEE' && `${option.priceAmount} zł`}
                              {option.priceType === 'PER_PERSON' && `${option.priceAmount} zł/os`}
                              {option.priceType === 'PER_ADULT' && `${option.priceAmount} zł/dorosły`}
                              {option.priceType === 'FREE' && 'Gratis'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary & Save */}
      {selectedPackage && (
        <Card className="sticky bottom-4 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold mb-1">Podsumowanie</h4>
                <p className="text-sm text-muted-foreground">
                  Pakiet: {selectedPackage.name} • {guestCounts.adults + guestCounts.children + guestCounts.toddlers} gości
                  {selectedOptions.length > 0 && ` • ${selectedOptions.length} dodatków`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {calculating ? (
                    <Loader2 className="h-6 w-6 animate-spin inline" />
                  ) : (
                    `${totalPrice.toFixed(2)} zł`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Łączna cena</p>
              </div>
              <Button
                size="lg"
                onClick={handleSaveMenu}
                disabled={saving || calculating}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Zapisywanie...
                  </>
                ) : (
                  'Dodaj menu'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

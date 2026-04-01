import { toast } from 'sonner';
import type { CategorySettingInput } from '@/types/menu';

export interface PackageFormData {
  name: string;
  description: string;
  shortDescription: string;
  pricePerAdult: string;
  pricePerChild: string;
  pricePerToddler: string;
  displayOrder: number;
  isPopular: boolean;
  isRecommended: boolean;
  color: string;
  icon: string;
  badgeText: string;
}

export function validateForm(formData: PackageFormData, categorySettings: CategorySettingInput[]): boolean {
  // Name validation
  if (!formData.name || formData.name.trim().length < 3) {
    toast.error('Błąd walidacji', {
      description: 'Nazwa pakietu musi mieć co najmniej 3 znaki',
      duration: 4000,
    });
    return false;
  }

  // Price validation
  const adultPrice = parseFloat(formData.pricePerAdult);
  if (isNaN(adultPrice) || adultPrice <= 0) {
    toast.error('Błąd walidacji', {
      description: 'Cena dla dorosłych musi być większa od 0',
      duration: 4000,
    });
    return false;
  }

  const childPrice = parseFloat(formData.pricePerChild);
  if (isNaN(childPrice) || childPrice < 0) {
    toast.error('Błąd walidacji', {
      description: 'Cena dla dzieci nie może być ujemna',
      duration: 4000,
    });
    return false;
  }

  // Color validation
  if (formData.color && !/^[0-9A-Fa-f]{6}$/.test(formData.color.replace('#', ''))) {
    toast.warning('Nieprawidłowy kolor', {
      description: 'Kolor musi być w formacie HEX (np. 3b82f6)',
      duration: 4000,
    });
    return false;
  }

  // Category settings validation
  const enabledCategories = categorySettings.filter((cs) => cs.isEnabled);
  if (enabledCategories.length === 0) {
    toast.warning('📂 Brak kategorii', {
      description: 'Dodaj i włącz co najmniej jedną kategorię do pakietu',
      duration: 4000,
    });
    return false;
  }

  return true;
}

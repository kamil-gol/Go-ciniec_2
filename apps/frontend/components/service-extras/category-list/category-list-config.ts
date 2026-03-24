import type {
  ServiceCategory,
  ServiceItem,
} from '@/types/service-extra.types';

// Constants

export const PRICE_LABELS: Record<string, string> = {
  FLAT: 'Kwota stała',
  PER_PERSON: 'Za osobę',
  PER_UNIT: 'Za sztukę',
  FREE: 'Gratis',
};

export const PRICE_TYPE_STYLES: Record<string, string> = {
  FLAT: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  PER_PERSON: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
  PER_UNIT: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  FREE: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
};

/** Helper: price suffix based on priceType */
export function priceSuffix(priceType: string): string {
  switch (priceType) {
    case 'PER_PERSON': return '/os.';
    case 'PER_UNIT': return '/szt.';
    default: return '';
  }
}

// Props

export interface ServiceCategoryListProps {
  categories: ServiceCategory[];
  onEditCategory: (category: ServiceCategory) => void;
  onCreateItem: (categoryId?: string) => void;
  onEditItem: (item: ServiceItem) => void;
  flatItemView?: boolean;
}

export interface CategoryRowProps {
  category: ServiceCategory;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onEditCategory: (cat: ServiceCategory) => void;
  onCreateItem: (categoryId?: string) => void;
  onEditItem: (item: ServiceItem) => void;
  onDeleteCategory: (cat: ServiceCategory) => void;
  onDeleteItem: (item: ServiceItem) => void;
}

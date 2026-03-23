export interface DishSelection {
  dishId: string;
  quantity: number;
}

export interface CategorySelection {
  categoryId: string;
  dishes: DishSelection[];
}

// #216: Category extras data returned alongside dish selections
export interface CategoryExtraResult {
  categoryId: string;
  packageCategorySettingsId: string;
  extraQuantity: number;      // portions beyond base maxSelect
  pricePerItem: number;       // from PackageCategorySettings.extraItemPrice
  portionTarget: string;      // ALL | ADULTS_ONLY | CHILDREN_ONLY
}

export interface DishSelectorResult {
  selections: CategorySelection[];
  categoryExtras: CategoryExtraResult[];
}

export interface DishSelectorProps {
  packageId: string;
  adults: number;
  childrenCount: number;
  toddlers?: number;
  initialSelections?: CategorySelection[];
  initialExtrasEnabled?: Record<string, boolean>;
  onComplete: (result: DishSelectorResult) => void;
  onBack: () => void;
}

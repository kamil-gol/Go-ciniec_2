/**
 * MenuDishesPreview Component
 * 
 * Displays selected dishes in a beautiful, organized way
 */

'use client';

import { UtensilsCrossed, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DishSelection {
  dishId: string;
  dishName: string;
  quantity: number;
  allergens?: string[];
  description?: string;
}

interface CategorySelection {
  categoryId: string;
  categoryName: string;
  dishes: DishSelection[];
}

interface MenuDishesPreviewProps {
  dishSelections: CategorySelection[];
  className?: string;
}

const ALLERGEN_LABELS: Record<string, string> = {
  gluten: 'Gluten',
  lactose: 'Laktoza',
  eggs: 'Jajka',
  nuts: 'Orzechy',
  fish: 'Ryby',
  soy: 'Soja',
  shellfish: 'Skorupiaki',
  peanuts: 'Orzeszki ziemne',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Dania główne': '🍽️',
  'Dodatki': '🥔',
  'Sałatki': '🥗',
  'Desery': '🍰',
  'Zupy': '🍲',
  'Przystawki': '🥘',
};

export function MenuDishesPreview({ dishSelections, className }: MenuDishesPreviewProps) {
  if (!dishSelections || dishSelections.length === 0) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <UtensilsCrossed className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm text-muted-foreground">Brak wybranych dań</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {dishSelections.map((category) => {
        const icon = CATEGORY_ICONS[category.categoryName] || '🍽️';
        const totalQuantity = category.dishes.reduce((sum, d) => sum + d.quantity, 0);

        return (
          <Card key={category.categoryId} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-2xl">{icon}</span>
                <span>{category.categoryName}</span>
                <Badge variant="secondary" className="ml-auto">
                  {totalQuantity} {totalQuantity === 1 ? 'porcja' : totalQuantity < 5 ? 'porcje' : 'porcji'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {category.dishes.map((dish, idx) => (
                  <div
                    key={dish.dishId}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg transition-colors',
                      'hover:bg-gray-50 dark:hover:bg-gray-800',
                      idx !== category.dishes.length - 1 && 'border-b'
                    )}
                  >
                    {/* Quantity Badge */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                        {dish.quantity === Math.floor(dish.quantity) 
                          ? dish.quantity 
                          : dish.quantity.toFixed(1)}
                        <span className="text-xs ml-0.5">×</span>
                      </div>
                    </div>

                    {/* Dish Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1">{dish.dishName}</h4>
                      
                      {dish.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {dish.description}
                        </p>
                      )}

                      {/* Allergens */}
                      {dish.allergens && dish.allergens.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <AlertCircle className="h-3 w-3 text-orange-500 flex-shrink-0" />
                          {dish.allergens.map((allergen) => (
                            <Badge
                              key={allergen}
                              variant="outline"
                              className="text-xs px-1.5 py-0 h-5 border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-400"
                            >
                              {ALLERGEN_LABELS[allergen] || allergen}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Compact version for smaller spaces
 */
export function MenuDishesPreviewCompact({ dishSelections, className }: MenuDishesPreviewProps) {
  if (!dishSelections || dishSelections.length === 0) {
    return null;
  }

  const totalDishes = dishSelections.reduce(
    (sum, cat) => sum + cat.dishes.reduce((s, d) => s + d.quantity, 0),
    0
  );

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <UtensilsCrossed className="h-4 w-4" />
        <span>Wybrane dania: {totalDishes} porcji</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {dishSelections.map((category) => (
          <div
            key={category.categoryId}
            className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <span className="text-lg">{CATEGORY_ICONS[category.categoryName] || '🍽️'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{category.categoryName}</p>
              <p className="text-xs text-muted-foreground">
                {category.dishes.length} {category.dishes.length === 1 ? 'danie' : 'dań'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

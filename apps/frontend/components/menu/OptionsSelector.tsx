/**
 * OptionsSelector Component
 * 
 * Filterable and searchable list of menu options
 */

'use client';

import { useState, useMemo } from 'react';
import { MenuOption } from '@/types/menu.types';
import { OptionCard, OptionCardSkeleton } from '@/components/menu';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { translateOptionCategory, sortCategories } from '@/lib/menu-utils';

interface OptionsSelectorProps {
  options: MenuOption[];
  isLoading?: boolean;
  quantities: Record<string, number>;
  onQuantityChange: (optionId: string, quantity: number) => void;
}

export function OptionsSelector({
  options,
  isLoading,
  quantities,
  onQuantityChange,
}: OptionsSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories with counts (translated to Polish)
  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>();
    options.forEach(option => {
      const translatedCategory = translateOptionCategory(option.category);
      const count = categoryMap.get(translatedCategory) || 0;
      categoryMap.set(translatedCategory, count + 1);
    });
    
    const categoryList = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }));
    
    // Sort categories with preferred order
    const sortedNames = sortCategories(categoryList.map(c => c.name));
    return sortedNames.map(name => ({
      name,
      count: categoryList.find(c => c.name === name)!.count
    }));
  }, [options]);

  // Filter options
  const filteredOptions = useMemo(() => {
    return options.filter(option => {
      const translatedCategory = translateOptionCategory(option.category);
      
      // Category filter
      if (selectedCategory && translatedCategory !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          option.name.toLowerCase().includes(query) ||
          option.description?.toLowerCase().includes(query) ||
          translatedCategory.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [options, selectedCategory, searchQuery]);

  const hasFilters = selectedCategory !== null || searchQuery !== '';

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <OptionCardSkeleton key={i} />)}
      </div>
    );
  }

  if (!options || options.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-neutral-950 rounded-2xl border-2">
        <p className="text-muted-foreground">Brak dostępnych opcji dodatkowych</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Szukaj opcji..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 pr-10 h-14 text-lg bg-white dark:bg-neutral-950 border-2 focus:ring-4 focus:ring-green-500/20"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Category Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Kategorie</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === null ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer text-sm px-4 py-2 transition-all',
              selectedCategory === null
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
            )}
            onClick={() => setSelectedCategory(null)}
          >
            Wszystkie ({options.length})
          </Badge>
          {categories.map(category => (
            <Badge
              key={category.name}
              variant={selectedCategory === category.name ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer text-sm px-4 py-2 transition-all',
                selectedCategory === category.name
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              )}
              onClick={() => setSelectedCategory(category.name)}
            >
              {category.name} ({category.count})
            </Badge>
          ))}
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasFilters && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Znaleziono {filteredOptions.length} z {options.length} opcji
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <X className="mr-2 h-4 w-4" />
            Wyczyść filtry
          </Button>
        </div>
      )}

      {/* Options List */}
      {filteredOptions.length > 0 ? (
        <div className="space-y-4">
          {filteredOptions.map(option => (
            <OptionCard
              key={option.id}
              option={option}
              quantity={quantities[option.id] || 0}
              onQuantityChange={onQuantityChange}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-neutral-950 rounded-2xl border-2">
          <p className="text-muted-foreground">Brak opcji pasujących do filtrów</p>
        </div>
      )}
    </div>
  );
}

# 🎨 Menu Components

Reusable React components for Menu System UI.

## 📦 Components

1. **MenuCard** - Display menu template
2. **PackageCard** - Display pricing package
3. **OptionCard** - Display menu option with quantity selector
4. **PriceBreakdown** - Display price calculation

---

## 🚀 Usage

### Import

```typescript
import { 
  MenuCard, 
  PackageCard, 
  OptionCard, 
  PriceBreakdown 
} from '@/components/menu';
```

---

## 🎯 MenuCard

Displays a menu template with event type, validity, and package count.

### Props

```typescript
interface MenuCardProps {
  template: MenuTemplate;        // Menu template data
  onSelect?: (template) => void; // Selection callback
  className?: string;            // Additional classes
}
```

### Example

```typescript
import { useMenuTemplates } from '@/hooks/use-menu';
import { MenuCard, MenuCardSkeleton } from '@/components/menu';

function MenuList() {
  const { data: templates, isLoading } = useMenuTemplates({ 
    isActive: true 
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => <MenuCardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {templates?.map(template => (
        <MenuCard 
          key={template.id}
          template={template}
          onSelect={(t) => console.log('Selected:', t.name)}
        />
      ))}
    </div>
  );
}
```

### Features

- ✅ Event type badge with color
- ✅ Gradient header (customizable with eventType.color)
- ✅ Validity dates (formatted in Polish)
- ✅ Package count
- ✅ Active status badge
- ✅ Click handler
- ✅ Framer Motion animations
- ✅ Dark mode support

---

## 📦 PackageCard

Displays a package with pricing tiers and included items.

### Props

```typescript
interface PackageCardProps {
  package: MenuPackage;           // Package data
  isSelected?: boolean;           // Selection state
  onSelect?: (pkg) => void;       // Selection callback
  className?: string;             // Additional classes
}
```

### Example

```typescript
import { useMenuPackages } from '@/hooks/use-menu';
import { PackageCard } from '@/components/menu';
import { useState } from 'react';

function PackageSelector({ templateId }: { templateId: string }) {
  const { data: packages } = useMenuPackages(templateId);
  const [selectedId, setSelectedId] = useState<string>();

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {packages?.map(pkg => (
        <PackageCard
          key={pkg.id}
          package={pkg}
          isSelected={selectedId === pkg.id}
          onSelect={(p) => setSelectedId(p.id)}
        />
      ))}
    </div>
  );
}
```

### Features

- ✅ Adult/Child/Toddler pricing
- ✅ Polish currency formatting (PLN)
- ✅ Popular/Recommended badges
- ✅ Included items checklist
- ✅ Guest limits display
- ✅ Selection indicator
- ✅ Color accent bar
- ✅ Hover effects

---

## ⭐ OptionCard

Displays a menu option with category, price, and quantity selector.

### Props

```typescript
interface OptionCardProps {
  option: MenuOption;                          // Option data
  quantity?: number;                           // Current quantity
  onQuantityChange?: (id, qty) => void;       // Quantity change callback
  className?: string;                          // Additional classes
}
```

### Example

```typescript
import { useMenuOptions } from '@/hooks/use-menu';
import { OptionCard } from '@/components/menu';
import { useState } from 'react';

function OptionsSelector() {
  const { data: options } = useMenuOptions({ category: 'Alkohol' });
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleQuantityChange = (optionId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [optionId]: quantity
    }));
  };

  return (
    <div className="space-y-4">
      {options?.map(option => (
        <OptionCard
          key={option.id}
          option={option}
          quantity={quantities[option.id] || 0}
          onQuantityChange={handleQuantityChange}
        />
      ))}
    </div>
  );
}
```

### Features

- ✅ Category badge with icon
- ✅ Price type handling (FLAT/PER_PERSON/FREE)
- ✅ Quantity selector (+/- buttons)
- ✅ Max quantity enforcement
- ✅ Single vs multiple selection
- ✅ Selection indicator
- ✅ Animated interactions

---

## 💰 PriceBreakdown

Displays detailed price calculation with collapsible sections.

### Props

```typescript
interface PriceBreakdownProps {
  breakdown: PriceBreakdown;     // Price breakdown data
  showDetails?: boolean;          // Show/hide details (default: true)
  className?: string;             // Additional classes
}
```

### Example

```typescript
import { useReservationMenu } from '@/hooks/use-menu';
import { PriceBreakdown } from '@/components/menu';

function ReservationSummary({ reservationId }: { reservationId: string }) {
  const { data } = useReservationMenu(reservationId);

  if (!data?.priceBreakdown) return null;

  return (
    <div className="space-y-6">
      <h2>Podsumowanie</h2>
      <PriceBreakdown breakdown={data.priceBreakdown} />
    </div>
  );
}
```

### Features

- ✅ Package cost breakdown (adults/children/toddlers)
- ✅ Options cost with quantities
- ✅ Collapsible sections
- ✅ Total price calculation
- ✅ VAT info
- ✅ Animated expand/collapse
- ✅ Polish currency formatting

---

## 🎨 Styling

All components use:
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **Dark mode** support out of the box

### Customization

```typescript
// Custom styling
<MenuCard 
  template={template}
  className="shadow-2xl hover:scale-105"
/>

// Custom colors (via template.eventType.color)
template.eventType.color = '#FF6B9D'; // Pink gradient
```

---

## 🔗 Integration with Hooks

### Full Example: Menu Selection Page

```typescript
'use client';

import { useState } from 'react';
import { 
  useMenuTemplates, 
  useMenuPackages, 
  useMenuOptions 
} from '@/hooks/use-menu';
import { 
  MenuCard, 
  PackageCard, 
  OptionCard, 
  PriceBreakdown 
} from '@/components/menu';

export function MenuSelectionPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>();
  const [selectedPackage, setSelectedPackage] = useState<string>();
  const [optionQuantities, setOptionQuantities] = useState<Record<string, number>>({});

  const { data: templates } = useMenuTemplates({ isActive: true });
  const { data: packages } = useMenuPackages(selectedTemplate);
  const { data: options } = useMenuOptions({ isActive: true });

  return (
    <div className="space-y-12">
      {/* Step 1: Select Template */}
      <section>
        <h2>Wybierz Menu</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {templates?.map(t => (
            <MenuCard
              key={t.id}
              template={t}
              onSelect={(template) => setSelectedTemplate(template.id)}
            />
          ))}
        </div>
      </section>

      {/* Step 2: Select Package */}
      {selectedTemplate && (
        <section>
          <h2>Wybierz Pakiet</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {packages?.map(p => (
              <PackageCard
                key={p.id}
                package={p}
                isSelected={selectedPackage === p.id}
                onSelect={(pkg) => setSelectedPackage(pkg.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Step 3: Select Options */}
      {selectedPackage && (
        <section>
          <h2>Opcje Dodatkowe</h2>
          <div className="space-y-4">
            {options?.map(o => (
              <OptionCard
                key={o.id}
                option={o}
                quantity={optionQuantities[o.id] || 0}
                onQuantityChange={(id, qty) => {
                  setOptionQuantities(prev => ({ ...prev, [id]: qty }));
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

---

## 📊 Loading States

Every component has a skeleton loader:

```typescript
import { 
  MenuCardSkeleton,
  PackageCardSkeleton,
  OptionCardSkeleton,
  PriceBreakdownSkeleton
} from '@/components/menu';

function LoadingState() {
  return (
    <>
      <MenuCardSkeleton />
      <PackageCardSkeleton />
      <OptionCardSkeleton />
      <PriceBreakdownSkeleton />
    </>
  );
}
```

---

## 🎯 Best Practices

### 1. Always handle loading states

```typescript
const { data, isLoading } = useMenuTemplates();

if (isLoading) return <MenuCardSkeleton />;
if (!data) return null;
```

### 2. Use controlled components

```typescript
const [selected, setSelected] = useState<string>();

<PackageCard
  isSelected={selected === pkg.id}
  onSelect={(p) => setSelected(p.id)}
/>
```

### 3. Group options by category

```typescript
const { data: grouped } = useOptionsGroupedByCategory();

Object.entries(grouped).map(([category, options]) => (
  <section key={category}>
    <h3>{category}</h3>
    {options.map(opt => <OptionCard option={opt} />)}
  </section>
));
```

---

## 🐛 Troubleshooting

### Component not rendering?

- Check if data is loaded: `console.log(data)`
- Verify types match: `MenuTemplate`, `MenuPackage`, etc.
- Check for missing props

### Styles not working?

- Ensure Tailwind is configured
- Check dark mode classes
- Verify `cn()` utility exists in `@/lib/utils`

### Animations not working?

- Check Framer Motion is installed
- Verify `'use client'` directive is present

---

## 📚 Related

- [Menu Hooks Documentation](../../hooks/use-menu.ts)
- [Menu Types](../../types/menu.types.ts)
- [Menu API Client](../../lib/api/menu-api.ts)

---

**Created:** 2026-02-10  
**Status:** ✅ Production Ready  
**Version:** 1.0.0  

# 🎨 Menu Components

Reusable React components for Menu System UI.

## 📦 Components

### Core Components
1. **MenuCard** - Display menu template
2. **PackageCard** - Display pricing package
3. **OptionCard** - Display menu option with quantity selector
4. **PriceBreakdown** - Display price calculation

### Feature Components
5. **MenuSelectionFlow** - Multi-step wizard for complete menu selection
6. **MenuSummary** - Summary view with all selections

---

## 🚀 Quick Start

### View Live Demo

```bash
# Start frontend
cd /home/kamil/rezerwacje
docker compose up frontend

# Visit demo page
http://localhost:3000/demo/menu
```

### Import

```typescript
import { 
  MenuCard, 
  PackageCard, 
  OptionCard, 
  PriceBreakdown,
  MenuSelectionFlow,
  MenuSummary
} from '@/components/menu';
```

---

## 🎯 Core Components

### MenuCard

Displays a menu template with event type, validity, and package count.

**Props:**
```typescript
interface MenuCardProps {
  template: MenuTemplate;        // Menu template data
  onSelect?: (template) => void; // Selection callback
  className?: string;            // Additional classes
}
```

**Example:**
```typescript
import { useMenuTemplates } from '@/hooks/use-menu';
import { MenuCard } from '@/components/menu';

function MenuList() {
  const { data: templates } = useMenuTemplates({ isActive: true });

  return (
    <div className="grid gap-6 md:grid-cols-3">
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

---

### PackageCard

Displays a package with pricing tiers and included items.

**Props:**
```typescript
interface PackageCardProps {
  package: MenuPackage;           // Package data
  isSelected?: boolean;           // Selection state
  onSelect?: (pkg) => void;       // Selection callback
  className?: string;             // Additional classes
}
```

**Example:**
```typescript
const [selectedId, setSelectedId] = useState<string>();

<PackageCard
  package={pkg}
  isSelected={selectedId === pkg.id}
  onSelect={(p) => setSelectedId(p.id)}
/>
```

---

### OptionCard

Displays a menu option with category, price, and quantity selector.

**Props:**
```typescript
interface OptionCardProps {
  option: MenuOption;                          // Option data
  quantity?: number;                           // Current quantity
  onQuantityChange?: (id, qty) => void;       // Quantity change callback
  className?: string;                          // Additional classes
}
```

**Example:**
```typescript
const [quantities, setQuantities] = useState<Record<string, number>>({});

<OptionCard
  option={option}
  quantity={quantities[option.id] || 0}
  onQuantityChange={(id, qty) => {
    setQuantities(prev => ({ ...prev, [id]: qty }));
  }}
/>
```

---

### PriceBreakdown

Displays detailed price calculation with collapsible sections.

**Props:**
```typescript
interface PriceBreakdownProps {
  breakdown: PriceBreakdown;     // Price breakdown data
  showDetails?: boolean;          // Show/hide details (default: true)
  className?: string;             // Additional classes
}
```

---

## 🎉 Feature Components

### MenuSelectionFlow

**Multi-step wizard for complete menu selection process.**

**Features:**
- ✅ 4-step flow: Template → Package → Guests → Options
- ✅ Progress indicator
- ✅ State management
- ✅ Validation
- ✅ Guest counts input
- ✅ Complete selection callback

**Props:**
```typescript
interface MenuSelectionFlowProps {
  eventTypeId?: string;           // Filter by event type
  onComplete?: (selection) => void; // Called when complete
  className?: string;
}

interface Selection {
  template: MenuTemplate;
  package: MenuPackage;
  selectedOptions: SelectedOption[];
  guestCounts: {
    adults: number;
    children: number;
    toddlers: number;
  };
}
```

**Example:**
```typescript
import { MenuSelectionFlow } from '@/components/menu';

function ReservationPage() {
  return (
    <MenuSelectionFlow
      eventTypeId="wedding-123"
      onComplete={(selection) => {
        console.log('Selection:', selection);
        // Save to database
        // Navigate to next step
      }}
    />
  );
}
```

---

### MenuSummary

**Complete summary view of menu selection.**

**Features:**
- ✅ Template & Package details
- ✅ Guest counts breakdown
- ✅ Selected options list
- ✅ Price breakdown integration
- ✅ Edit/Confirm actions
- ✅ Sticky price on scroll

**Props:**
```typescript
interface MenuSummaryProps {
  template: MenuTemplate;
  package: MenuPackage;
  selectedOptions: (MenuOption & { quantity: number })[];
  guestCounts: {
    adults: number;
    children: number;
    toddlers: number;
  };
  priceBreakdown?: PriceBreakdown;
  onEdit?: () => void;
  onConfirm?: () => void;
  className?: string;
}
```

**Example:**
```typescript
import { MenuSummary } from '@/components/menu';

function ConfirmationPage() {
  return (
    <MenuSummary
      template={selectedTemplate}
      package={selectedPackage}
      selectedOptions={optionsWithQuantity}
      guestCounts={{ adults: 50, children: 10, toddlers: 5 }}
      priceBreakdown={calculatedPrices}
      onEdit={() => router.push('/edit')}
      onConfirm={handleSaveReservation}
    />
  );
}
```

---

## 🎨 Features Matrix

| Feature | MenuCard | PackageCard | OptionCard | PriceBreakdown | Flow | Summary |
|---------|----------|-------------|------------|----------------|------|----------|
| **Responsive** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dark Mode** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Animations** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Skeleton** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Interactive** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Polish i18n** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Type-safe** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 💡 Complete Example: Reservation Flow

```typescript
'use client';

import { useState } from 'react';
import { MenuSelectionFlow, MenuSummary } from '@/components/menu';
import { useCalculatePrices } from '@/hooks/use-menu';

export default function ReservationMenuPage() {
  const [step, setStep] = useState<'selection' | 'summary'>('selection');
  const [selection, setSelection] = useState<any>();

  // Calculate prices when selection is complete
  const { data: priceBreakdown } = useCalculatePrices({
    templateId: selection?.template.id,
    packageId: selection?.package.id,
    selectedOptions: selection?.selectedOptions,
    guestCounts: selection?.guestCounts,
  });

  if (step === 'selection') {
    return (
      <MenuSelectionFlow
        onComplete={(data) => {
          setSelection(data);
          setStep('summary');
        }}
      />
    );
  }

  return (
    <MenuSummary
      {...selection}
      priceBreakdown={priceBreakdown}
      onEdit={() => setStep('selection')}
      onConfirm={async () => {
        // Save reservation menu
        const response = await fetch('/api/reservations/menu', {
          method: 'POST',
          body: JSON.stringify(selection),
        });
        // Navigate to next step
      }}
    />
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

### 3. Validate before submit

```typescript
const handleComplete = (selection) => {
  if (!selection.template || !selection.package) {
    toast.error('Wybierz menu i pakiet');
    return;
  }
  // Proceed...
};
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

## 🚀 Demo Page

**URL:** `http://localhost:3000/demo/menu`

**Features:**
- 🎨 Component Gallery - View all components with live data
- 🔄 Selection Flow - Interactive multi-step wizard
- 💡 Live Examples - Click and interact
- 📊 API Integration - Real backend data

---

## 📚 Related

- [Menu Hooks Documentation](../../hooks/use-menu.ts)
- [Menu Types](../../types/menu.types.ts)
- [Menu API Client](../../lib/api/menu-api.ts)
- [Demo Page](../../app/demo/menu/page.tsx)

---

**Created:** 2026-02-10  
**Updated:** 2026-02-10  
**Status:** ✅ Production Ready  
**Version:** 2.0.0  

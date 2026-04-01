# Design System — Ściągawka

Plik źródłowy: `apps/frontend/lib/design-tokens.ts`
Import: `import { CATERING_ACCENT, layout, typography, ... } from "@/lib/design-tokens"`

---

## Akcenty modułów — grupy i eksportowane stałe

### CORE/OPERATIONS (granat/navy) — `coreOps`
Eksportowane stałe: `DASHBOARD_ACCENT`, `DAILY_VIEW_ACCENT`, `RESERVATIONS_ACCENT`,
`CLIENTS_ACCENT`, `QUEUE_ACCENT`, `NOTIFICATIONS_ACCENT`

```
gradient:       from-[#1e3a5f] via-[#2a4a70] to-[#1e3a5f]
gradientSubtle: from-blue-900/5 via-slate-800/5 to-blue-900/5
iconBg:         from-[#2a4a70] to-[#1e3a5f]
text:           text-[#1e3a5f]  |  textDark: dark:text-blue-300
badge:          bg-blue-50 dark:bg-blue-950/30
badgeText:      text-blue-800 dark:text-blue-300
ring:           ring-blue-800/20
```

### FINANCE (morski/teal) — `finance`
Eksportowane stałe: `DEPOSITS_ACCENT`, `REPORTS_ACCENT`

```
gradient:       from-[#1a4a4a] via-[#1f5c5c] to-[#1a4a4a]
gradientSubtle: from-teal-900/5 via-emerald-900/5 to-teal-900/5
iconBg:         from-[#1f5c5c] to-[#1a4a4a]
text:           text-teal-700  |  textDark: dark:text-teal-300
badge:          bg-teal-50 dark:bg-teal-950/30
badgeText:      text-teal-800 dark:text-teal-300
ring:           ring-teal-700/20
```

### CONFIGURATION (łupek/slate) — `config`
Eksportowane stałe: `SETTINGS_ACCENT`, `HALLS_ACCENT`, `EVENT_TYPES_ACCENT`,
`AUDIT_LOG_ACCENT`, `ARCHIVE_ACCENT`, `DOCUMENT_TEMPLATES_ACCENT`

```
gradient:       from-[#374151] via-[#475569] to-[#374151]
gradientSubtle: from-neutral-800/5 via-slate-700/5 to-neutral-800/5
iconBg:         from-[#475569] to-[#374151]
text:           text-slate-600  |  textDark: dark:text-slate-300
badge:          bg-slate-100 dark:bg-slate-900/30
badgeText:      text-slate-700 dark:text-slate-300
ring:           ring-slate-500/20
```

### CULINARY (bursztyn/amber) — `culinary`
Eksportowane stałe: `CATERING_ACCENT`, `MENU_ACCENT`, `SERVICE_EXTRAS_ACCENT`

```
gradient:       from-[#7c4a15] via-[#92600a] to-[#7c4a15]
gradientSubtle: from-amber-900/5 via-yellow-900/5 to-amber-900/5
iconBg:         from-[#92600a] to-[#7c4a15]
text:           text-amber-700  |  textDark: dark:text-amber-300
badge:          bg-amber-50 dark:bg-amber-950/30
badgeText:      text-amber-800 dark:text-amber-300
ring:           ring-amber-700/20
```

---

## Layout tokens (`layout.*`)

```typescript
containerClass  "container mx-auto py-6 px-4 sm:py-8 sm:px-6 space-y-6 sm:space-y-8"
maxWidth        "max-w-7xl"
narrowWidth     "max-w-5xl"
cardHover       "hover:shadow-md hover:-translate-y-1 transition-all duration-300"
sectionGap      "space-y-6 sm:space-y-8"
statGrid        "grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"       // 4-kolumnowy
statGrid3       "grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6"       // 3-kolumnowy
statGrid6       "grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5"
cardPadding     "p-4 sm:p-6"
detailGrid      "grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
entityGrid      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
entityGrid4     "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
```

## Typography tokens (`typography.*`)

```typescript
pageTitle           "text-2xl sm:text-4xl font-bold tracking-tight"
pageTitleStandalone "text-2xl sm:text-3xl font-bold text-foreground"
sectionTitle        "text-lg sm:text-xl font-semibold text-foreground"
cardTitle           "text-base font-semibold text-foreground"
body                "text-sm text-foreground"
muted               "text-sm text-muted-foreground"
smallMuted          "text-xs text-muted-foreground"
label               "text-sm font-medium text-foreground"
heroSubtitle        "text-white/85 text-sm sm:text-lg"
statValue           "text-xl sm:text-2xl font-bold text-foreground"
statLabel           "text-xs sm:text-sm text-muted-foreground"
tableHeader         "text-xs font-medium uppercase tracking-wider text-muted-foreground"
```

---

## API komponentów shared

### `<PageHero>` — strony listowe
Import: `@/components/shared/PageHero`
```tsx
<PageHero
  accent={MODULE_ACCENT}        // wymagane: ModuleAccent z design-tokens.ts
  icon={LucideIconComponent}    // wymagane
  title="Tytuł strony"          // wymagane
  subtitle="Opis podstrony"     // opcjonalny
  action={<Button>...</Button>} // opcjonalny CTA w prawym górnym rogu
  backHref="/dashboard/modul"   // opcjonalny link powrotu
  backLabel="Powrót"            // label przycisku powrotu (jeśli backHref)
  stats={[                      // opcjonalne statystyki w hero
    { icon: Icon, label: "Etykieta", value: "Wartość" }
  ]}
/>
```

### `<DetailHero>` — strony detail
Import: `@/components/shared/DetailHero`
```tsx
<DetailHero
  gradient={MODULE_ACCENT.gradient}  // wymagane: string klasy gradientu
  icon={LucideIconComponent}         // wymagane
  title="Nazwa encji"                // wymagane
  subtitle="Numer / typ / info"      // opcjonalny
  extraLine="Dodatkowa linia"        // opcjonalny (np. firma klienta)
  backHref="/dashboard/.../lista"    // opcjonalny
  backLabel="Powrót do listy"        // opcjonalny
  badges={[<Badge>...</Badge>]}      // opcjonalne — statusy
  actions={[<Button>...</Button>]}   // opcjonalne — akcje (PDF, Edytuj, etc.)
  stats={[                           // opcjonalne — statystyki w dolnej belce
    { icon: Icon, label: "Data", value: "20 maja 2026" }
  ]}
/>
```

### `<SectionCard>` — sekcje treści na stronach detail
Import: `@/components/shared/SectionCard`
```tsx
<SectionCard
  icon={LucideIconComponent}
  iconClassName="bg-gradient-to-br from-amber-500 to-amber-600"  // kolor z grupy modułu
  title="Nazwa sekcji"
  badge={<CountBadge count={5} />}  // opcjonalny
>
  {/* zawartość */}
</SectionCard>
```

Eksporty z SectionCard:
- `StatPill` — kompaktowa statystyka (`icon`, `label`, `value`)
- `Field` — para label/value (`label`, `value`, `className?`)
- `CountBadge` — licznik (`count`)

### `<Breadcrumb>` — nawigacja okruszkowa
Import: `@/components/shared/Breadcrumb`
```tsx
<Breadcrumb />  // automatyczne — czyta usePathname()
```
Uwaga: wymaga żeby segmenty URL miały wpisy w `pathLabels` wewnątrz komponentu.
Sprawdź i dodaj brakujące etykiety PL do `pathLabels` w `Breadcrumb.tsx`.

### `<StatCard>` — karty statystyk na stronach listowych
Import: `@/components/shared/StatCard`
```tsx
<StatCard
  title="Wszystkie zamówienia"
  value={42}
  icon={ShoppingBag}
  accent={MODULE_ACCENT}
  description="W systemie"  // opcjonalny
/>
```

### `<EntityCard>` — karty encji na listach
Import: `@/components/shared/EntityCard`
```tsx
<EntityCard
  accent={MODULE_ACCENT}
  onClick={() => router.push(`/dashboard/modul/${entity.id}`)}
>
  {/* zawartość karty */}
</EntityCard>
```

### `<EmptyState>` — brak danych
Import: `@/components/shared/EmptyState`
```tsx
<EmptyState
  icon={LucideIconComponent}
  title="Brak [elementów]"
  description="Dodaj pierwszy [element] aby rozpocząć."
  action={<Button onClick={...}>+ Dodaj</Button>}  // opcjonalny
/>
```

---

## Framer Motion — wzorce animacji

### Pojedyncza karta / element
```tsx
import { motion } from "framer-motion"

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* zawartość */}
</motion.div>
```

### Lista ze stagger (każdy element z opóźnieniem)
```tsx
<motion.div
  className="grid grid-cols-1 gap-4"
  initial="hidden"
  animate="visible"
  variants={{
    visible: { transition: { staggerChildren: 0.05 } }
  }}
>
  {items.map((item, index) => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
      }}
    >
      {/* karta */}
    </motion.div>
  ))}
</motion.div>
```

---

## Ikony sekcji — wzorzec gradientowego tła

```tsx
// CULINARY (amber)
<div className="rounded-xl p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm">
  <IconComponent className="h-5 w-5" />
</div>

// CORE/OPS (navy)
<div className="rounded-xl p-2.5 bg-gradient-to-br from-[#2a4a70] to-[#1e3a5f] text-white shadow-sm">
  <IconComponent className="h-5 w-5" />
</div>

// CONFIGURATION (slate)
<div className="rounded-xl p-2.5 bg-gradient-to-br from-[#475569] to-[#374151] text-white shadow-sm">
  <IconComponent className="h-5 w-5" />
</div>

// FINANCE (teal)
<div className="rounded-xl p-2.5 bg-gradient-to-br from-[#1f5c5c] to-[#1a4a4a] text-white shadow-sm">
  <IconComponent className="h-5 w-5" />
</div>
```

---

## Mapowanie moduł → akcent (do importu)

| Moduł | Stała | Plik importu |
|-------|-------|--------------|
| dashboard | `DASHBOARD_ACCENT` | `@/lib/design-tokens` |
| reservations | `RESERVATIONS_ACCENT` | `@/lib/design-tokens` |
| clients | `CLIENTS_ACCENT` | `@/lib/design-tokens` |
| queue | `QUEUE_ACCENT` | `@/lib/design-tokens` |
| deposits | `DEPOSITS_ACCENT` | `@/lib/design-tokens` |
| reports | `REPORTS_ACCENT` | `@/lib/design-tokens` |
| halls | `HALLS_ACCENT` | `@/lib/design-tokens` |
| eventTypes | `EVENT_TYPES_ACCENT` | `@/lib/design-tokens` |
| auditLog | `AUDIT_LOG_ACCENT` | `@/lib/design-tokens` |
| archive | `ARCHIVE_ACCENT` | `@/lib/design-tokens` |
| documentTemplates | `DOCUMENT_TEMPLATES_ACCENT` | `@/lib/design-tokens` |
| catering | `CATERING_ACCENT` | `@/lib/design-tokens` |
| menu | `MENU_ACCENT` | `@/lib/design-tokens` |
| serviceExtras | `SERVICE_EXTRAS_ACCENT` | `@/lib/design-tokens` |

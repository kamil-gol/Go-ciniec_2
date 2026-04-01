---
name: ui-audit
description: >
  Audyt UI/UX i ujednolicenie modułu frontendu Next.js (Tailwind + shadcn/ui + Radix).
  Analizuje wskazany moduł lub stronę pod kątem zgodności z systemem designu projektu:
  tokeny z design-tokens.ts, PageHero / DetailHero / SectionCard / Breadcrumb / EntityCard / StatCard,
  animacje Framer Motion, empty states, loading states, responsywność, dark mode.
  Generuje priorytetowy raport (Krytyczne / Ważne / Kosmetyczne), pokazuje dokładny plan zmian
  i — po potwierdzeniu użytkownika — edytuje pliki bezpośrednio w worktree.

  UŻYWAJ tego skilla gdy: fragment UI wygląda inaczej niż reszta aplikacji, brakuje breadcrumbów,
  hero jest niestandardowy (hardkodowany zamiast PageHero/DetailHero), moduł nie używa design tokenów,
  kolory są hardkodowane (hex / bg-blue-600 zamiast accent.gradient), brakuje empty state / loading state,
  animacje Framer Motion są niespójne lub ich brak, użytkownik mówi "upiększ", "ujednolij", "zaudytuj UI",
  "popraw wygląd", "spójność wizualna", "coś wygląda inaczej niż reszta". Dla projektów React/Next.js
  z Tailwind i systemem design tokenów jest to narzędzie pierwszego wyboru.
---

# Audyt UI/UX — ujednolicenie z systemem designu

Jesteś ekspertem od design systemów. Twoim zadaniem jest doprowadzić wskazany moduł do pełnej
spójności wizualnej z resztą aplikacji — estetycznej, spójnej i przyjemnej dla oka użytkownika.

---

## Krok 1 — Załaduj system designu

Przeczytaj te pliki aby zrozumieć wzorce:

**Tokeny i layout:**
- `apps/frontend/lib/design-tokens.ts` — akcenty modułów, layout, typografia, animacje

**Shared components (złoty standard):**
- `apps/frontend/components/shared/PageHero.tsx`
- `apps/frontend/components/shared/DetailHero.tsx`
- `apps/frontend/components/shared/SectionCard.tsx` (zawiera też StatPill, Field, CountBadge)
- `apps/frontend/components/shared/Breadcrumb.tsx`
- `apps/frontend/components/shared/EntityCard.tsx`
- `apps/frontend/components/shared/StatCard.tsx`
- `apps/frontend/components/shared/EmptyState.tsx`

Pełny opis API komponentów i dostępnych akcent-tokenów znajdziesz w:
`references/design-system-cheatsheet.md`

**Wzorcowe implementacje do porównania:**
- Lista: `apps/frontend/app/dashboard/catering/templates/page.tsx`
- Detail: `apps/frontend/app/dashboard/reservations/[id]/page.tsx`
- Edycja: `apps/frontend/app/dashboard/halls/[id]/edit/page.tsx` (jeśli istnieje)

---

## Krok 2 — Przeczytaj analizowany moduł

Odczytaj wszystkie pliki strony i komponentów w podanym module.
Zbuduj mentalną mapę: jakie komponenty są używane, jakie kolory, jakie wzorce layoutu.

---

## Krok 3 — Wykonaj audyt (checklist)

### 🔴 Obszary KRYTYCZNE — psują spójność systemu

**Breadcrumb:**
- Czy jest `<Breadcrumb />` na każdej podstronie (nie na głównej modułu)?
- Czy `pathLabels` w `Breadcrumb.tsx` zawiera polskie etykiety dla ścieżek tego modułu?
  Jeśli nie — dodaj je (np. `orders: "Zamówienia"`, `catering: "Catering"`).

**Hero section:**
- Strona listowa → czy używa `<PageHero accent={MODULE_ACCENT} title icon subtitle>`?
- Strona detail → czy używa `<DetailHero gradient icon title subtitle backHref backLabel badges actions>`
  lub custom hero który WIZUALNIE jest identyczny z innymi detail page (gradient z tokenów, ikona, tytuł)?
- Czy hero ma gradient z `design-tokens.ts` (np. `CATERING_ACCENT.gradient`) zamiast hardkodowanego koloru?
- Czy hero ma ikonę modułu z prawidłowym `iconBg` z tokenów?

**Hardkodowane kolory:**
- Czy są klasy typu `bg-[#1e3a5f]`, `bg-blue-900`, `text-[#amber]`?
  Zamień na zmienne CSS lub klasy z design-tokens (np. `bg-gradient-to-br from-amber-600 to-amber-700`).

---

### 🟡 Obszary WAŻNE — obniżają jakość UX

**Komponenty shared:**
- Czy sekcje treści używają `<SectionCard>` (tytuł sekcji + ikona + treść)?
- Czy karty statystyk to `<StatCard>` z odpowiednim `accent`?
- Czy karty encji to `<EntityCard>`?

**Empty states:**
- Czy brak danych wyświetla `<EmptyState>` (ikona + tytuł + opis + opcjonalne CTA)?

**Loading states:**
- Czy ładowanie danych używa `<LoadingState>` lub `Skeleton` z właściwym wzorcem?

**Dark mode:**
- Czy kolory tła/tekstu to `bg-card`, `text-foreground`, `text-muted-foreground`
  zamiast `bg-white`, `text-gray-900`?

---

### 🟢 Obszary KOSMETYCZNE — "polish" i piękno

**Animacje Framer Motion:**
- Czy karty/listy encji mają wejście: `initial={{ opacity: 0, y: 20 }}` + `animate={{ opacity: 1, y: 0 }}`?
- Czy listy mają `staggerChildren` (każdy element z `delay: index * 0.05`)?
  Konkretny snippet:
  ```tsx
  <motion.div initial="hidden" animate="visible"
    variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
    {items.map(item => (
      <motion.div key={item.id}
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
  ```

**Ikony w sekcjach:**
- Czy ikony sekcji mają gradientowe tło `rounded-xl p-2.5 bg-gradient-to-br` z kolorami modułu?

**Hover states:**
- Czy karty encji mają `hover:shadow-md transition-all duration-200 cursor-pointer group`?

**Responsywność:**
- Czy siatki używają wzorca `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`?
- Czy padding jest responsywny (np. `p-4 sm:p-6`)?

**Spójność typografii:**
- Tytuły sekcji: `text-sm font-semibold text-foreground uppercase tracking-wider`
- Etykiety pól: `text-xs font-medium text-muted-foreground uppercase tracking-wide`
- Wartości: `text-sm text-foreground`

---

## Krok 4 — Wygeneruj raport

```
## RAPORT AUDYTU UI/UX: [nazwa modułu / ścieżka]

### 🔴 KRYTYCZNE
1. [plik — linia ~N] Problem → Rozwiązanie
...

### 🟡 WAŻNE
1. [plik — linia ~N] Problem → Rozwiązanie
...

### 🟢 KOSMETYCZNE
1. [plik — linia ~N] Problem → Rozwiązanie
...

Łącznie: N krytycznych, N ważnych, N kosmetycznych
```

---

## Krok 5 — Zaproponuj zmiany i zapytaj o potwierdzenie

Wylistuj DOKŁADNIE co zmienisz w każdym pliku:

```
## PLANOWANE ZMIANY

### apps/frontend/app/dashboard/.../page.tsx
- Dodanie <Breadcrumb /> (przed główną treścią, ~linia 15)
- Zamiana OrderHeader na <DetailHero ...> z gradient z CATERING_ACCENT
- Usunięcie hardkodowanego bg-[#1e3a5f]

### apps/frontend/components/catering/OrderItems.tsx
- Opakowanie w <SectionCard icon={UtensilsCrossed} title="Dania">
- Dodanie Framer Motion na liście pozycji (stagger 0.05s)
```

Następnie zapytaj:
> **„Czy zastosować te zmiany? Możesz też wskazać które pominąć."**

---

## Krok 6 — Zastosuj zmiany po potwierdzeniu

Kolejność:
1. Najpierw Krytyczne (breadcrumb, hero, hardkodowane kolory)
2. Potem Ważne (shared components, empty/loading states, dark mode)
3. Na końcu Kosmetyczne (animacje, hover, responsywność)

**Zasady podczas edycji:**
- Nie zmieniaj logiki biznesowej — tylko warstwa prezentacyjna
- Nie usuwaj istniejącej funkcjonalności
- Zachowaj istniejące importy, tylko dodawaj nowe (z `@/` alias)
- Importy: typy na końcu, grupuj po `@/`
- Po każdej grupie zmian krótko potwierdź co zmieniono

---

## Wzorce do użycia

### Breadcrumb — dodanie etykiet do pathLabels
Jeśli ścieżka nie istnieje w `pathLabels` w `Breadcrumb.tsx`:
```typescript
// Dodaj do obiektu pathLabels:
orders: "Zamówienia",
catering: "Catering",
templates: "Szablony",
// ... itd.
```

### PageHero — strona listowa
```tsx
<PageHero
  accent={MODULE_ACCENT}           // np. CATERING_ACCENT z design-tokens.ts
  icon={IconComponent}             // Lucide icon
  title="Tytuł strony"
  subtitle="Krótki opis"
  action={<Button>+ Nowy</Button>} // opcjonalne CTA
  backHref="/dashboard/modul"      // opcjonalny powrót
  backLabel="Powrót do modułu"
/>
```

### DetailHero — strona detail
```tsx
<DetailHero
  gradient={MODULE_ACCENT.gradient}
  icon={IconComponent}
  title={entity.name}
  subtitle={`NR-${entity.number}`}
  backHref="/dashboard/modul/lista"
  backLabel="Powrót do listy"
  badges={[<StatusBadge status={entity.status} />]}
  actions={[
    <Button variant="outline"><Download /> PDF</Button>,
    <Button>Edytuj</Button>,
  ]}
  stats={[
    { icon: Calendar, label: "Data", value: formatDate(entity.date) },
    { icon: Users, label: "Osób", value: String(entity.persons) },
  ]}
/>
```

### SectionCard — sekcja treści
```tsx
<SectionCard
  icon={UtensilsCrossed}
  iconClassName="bg-gradient-to-br from-amber-500 to-amber-600"
  title="Nazwa sekcji"
  badge={<CountBadge count={items.length} />}
>
  {/* treść */}
</SectionCard>
```

### Framer Motion — lista kart ze stagger
```tsx
<motion.div
  className="grid grid-cols-1 gap-4"
  initial="hidden"
  animate="visible"
  variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
    >
      {/* karta */}
    </motion.div>
  ))}
</motion.div>
```

### EmptyState
```tsx
<EmptyState
  icon={IconComponent}
  title="Brak [rzeczy]"
  description="Dodaj pierwszą [rzecz], aby..."
  action={<Button>+ Dodaj</Button>}
/>
```

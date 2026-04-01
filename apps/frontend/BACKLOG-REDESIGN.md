# BACKLOG REDESIGN UI/UX — Go-sciniec Frontend

> Data audytu: 2026-04-01
> Autor: Claude Opus 4.6 (audit) + Principal Frontend Engineer review
> Scope: 178 komponentow, 119 route files, 33 ui/ primitives

---

## FAZA 0: Foundation (Design System Tokens)

### [F0-01] Stworzyc `lib/motion-tokens.ts` — Motion Design System
**Priorytet**: Krytyczny | **Estymata**: S | **Blokuje**: F1, F4
- Nowy plik z: spring configs, ease curves, duration scale
- 10 gotowych variant objects (page, list, statCard, modal, drawer, sidebar, badge, tableRow, formField, toast)
- Import w kazdym komponencie zamiast inline animation values
- **Pliki do stworzenia**: `apps/frontend/lib/motion-tokens.ts`

### [F0-02] Przeprojektowac `lib/design-tokens.ts` — Unified Token System
**Priorytet**: Krytyczny | **Estymata**: M | **Blokuje**: F1, F2, F3, F4
- Usunac moduleAccents per-modul (16 roznych kolorow hero)
- Jeden globalny accent via CSS custom property `--accent`
- Nowe: `surfaces`, `feedback`, `typography` jako centralne tokeny
- Zachowac backward-compat export moduleAccents (deprecated) na czas migracji
- `statGradients` -> usunac, zastapic surface-based stat cards
- **Pliki do zmiany**: `apps/frontend/lib/design-tokens.ts`

### [F0-03] Zaktualizowac `app/globals.css` — Nowa paleta CSS Custom Properties
**Priorytet**: Krytyczny | **Estymata**: M | **Blokuje**: F1, F2, F3
- Nowa paleta "Chalk & Stone" (warm whites, sage green accent, deep navy text)
- OKLCH kolory z hex fallbackami
- Light mode + Dark mode pelne zestawy
- Nowe zmienne: `--bg`, `--surface`, `--surface-2`, `--surface-elevated`, `--text`, `--text-muted`, `--text-faint`, `--accent`, `--accent-hover`, `--accent-subtle`, `--border`, `--border-subtle`
- Nowe shadow tokens (warm-toned)
- **Pliki do zmiany**: `apps/frontend/app/globals.css`

### [F0-04] Zaktualizowac `tailwind.config.ts` — Mapowanie na CSS vars
**Priorytet**: Krytyczny | **Estymata**: S | **Blokuje**: F1
- Kolory mapujace na nowe CSS variables
- Zachowac istniejace primary/secondary/neutral/error/warning/success (backward compat)
- Dodac: `accent`, `surface`, `surface-2` jako aliasy
- **Pliki do zmiany**: `apps/frontend/tailwind.config.ts`

### [F0-05] Zaktualizowac `lib/status-colors.ts` — Uzyc CSS variables
**Priorytet**: Wysoki | **Estymata**: S | **Blokuje**: F1-06
- Mapowanie statusow na semantic CSS variables zamiast hardkodowanych Tailwind klas
- **Pliki do zmiany**: `apps/frontend/lib/status-colors.ts`

---

## FAZA 1: UI Primitives (nowe/rozszerzone komponenty)

### [F1-01] Stworzyc `ui/form-field.tsx` — FormField wrapper
**Priorytet**: Krytyczny | **Estymata**: S | **Blokuje**: F4 (formularze)
- Label + children (input/select/etc) + description + error message
- CVA variants: size (sm/md/lg)
- Required indicator
- Error z ikona AlertCircle
- **Pliki do stworzenia**: `apps/frontend/components/ui/form-field.tsx`

### [F1-02] Stworzyc `ui/status-badge.tsx` — Unified StatusBadge
**Priorytet**: Krytyczny | **Estymata**: M | **Blokuje**: F4 (listy, karty, detail)
- CVA variants: success/warning/error/info/neutral + size sm/md/lg
- Mapping WSZYSTKICH statusow systemu:
  - Reservation: CONFIRMED, PENDING, RESERVED, COMPLETED, CANCELLED
  - Deposit: PAID, PENDING, OVERDUE, PARTIAL
  - Catering: NEW, IN_PROGRESS, COMPLETED, CANCELLED
- Kazdy status: ikona Lucide + label PL + kolor z tokenow
- **Pliki do stworzenia**: `apps/frontend/components/ui/status-badge.tsx`

### [F1-03] Przeprojektowac `ui/stat-card.tsx` — Surface-based StatCard
**Priorytet**: Wysoki | **Estymata**: M | **Blokuje**: F4-01 (dashboard)
- Usunac `iconGradient` prop (gradient icon backgrounds)
- Jeden kolor ikony: `bg-accent/10 text-accent`
- AnimatedCounter (useSpring z Framer Motion)
- Trend indicator (TrendingUp/Down + kolor success/error)
- Skeleton loading state wbudowany
- Hover lift z motion-tokens
- **Pliki do zmiany**: Nowy `apps/frontend/components/shared/StatCard.tsx` (zastapic istniejacy)

### [F1-04] Uproscic `ui/section-card.tsx` — Bez color props
**Priorytet**: Wysoki | **Estymata**: S | **Blokuje**: F4 (detail views)
- Usunac `iconBg` i `iconColor` props (hardkodowane kolory)
- Ikona zawsze: `bg-accent/10 text-accent`
- Zachowac: `title`, `icon`, `badge`, `children`, `className`
- **Pliki do zmiany**: `apps/frontend/components/shared/SectionCard.tsx`

### [F1-05] Stworzyc `ui/confirm-modal.tsx` — Z AnimatePresence
**Priorytet**: Wysoki | **Estymata**: S | **Blokuje**: F4 (delete/archive flows)
- Bazowany na `shared/ConfirmDialog.tsx` + Framer Motion animacje
- Variants: destructive/warning/info (zachowac)
- Dodac: modalContentVariants z motion-tokens
- **Pliki do stworzenia**: `apps/frontend/components/ui/confirm-modal.tsx`

### [F1-06] Stworzyc `ui/error-state.tsx` — Zunifikowany error state
**Priorytet**: Sredni | **Estymata**: S
- Props: message, onRetry?, icon?
- Zastapi inline error divs na dashboard, listach, detail pages
- **Pliki do stworzenia**: `apps/frontend/components/ui/error-state.tsx`

### [F1-07] Stworzyc `ui/animated-counter.tsx` — Count-up animation
**Priorytet**: Sredni | **Estymata**: S
- useSpring z Framer Motion
- Formatowanie PL (toLocaleString)
- Reuse w StatCard i financial summaries
- **Pliki do stworzenia**: `apps/frontend/components/ui/animated-counter.tsx`

---

## FAZA 2: Shared Layer Rebuild

### [F2-01] Zastapic `PageHero.tsx` -> `PageHeader.tsx` (nowy)
**Priorytet**: Krytyczny | **Estymata**: M | **Blokuje**: F4 (wszystkie strony)
- Bez gradient background. Lekki, neutral.
- Props: title, subtitle, icon?, actions?
- Breadcrumbs zintegrowane (z shared/Breadcrumb)
- Framer Motion page entrance z motion-tokens
- Zachowac PageHero.tsx jako deprecated wrapper (console.warn) na czas migracji
- **Pliki do stworzenia**: `apps/frontend/components/shared/PageHeader.tsx`
- **Pliki do zmiany**: `apps/frontend/components/shared/PageHero.tsx` (deprecate)

### [F2-02] Zastapic `DetailHero.tsx` -> `DetailHeader.tsx` (nowy)
**Priorytet**: Wysoki | **Estymata**: M
- Bez gradient. Breadcrumb + title + status badge + action buttons
- Props: backHref, title, subtitle?, badges?, actions?
- **Pliki do stworzenia**: `apps/frontend/components/shared/DetailHeader.tsx`
- **Pliki do zmiany**: `apps/frontend/components/shared/DetailHero.tsx` (deprecate)

### [F2-03] Usunac `deposits/deposit-status-badge.tsx` — Dead wrapper
**Priorytet**: Niski | **Estymata**: XS
- 10 linii kodu, ktory tylko re-eksportuje StatusBadge
- **Pliki do usuniecia**: `apps/frontend/components/deposits/deposit-status-badge.tsx`
- **Pliki do zmiany**: Wszystkie importy w deposits/ -> import z ui/status-badge

### [F2-04] Merge `form/select-field.tsx` z `ui/select.tsx`
**Priorytet**: Sredni | **Estymata**: S
- select-field.tsx to wrapper na Radix Select z label/error
- Powinien byc czescia ui/select lub FormField pattern
- **Pliki do usuniecia**: `apps/frontend/components/form/select-field.tsx`
- **Pliki do zmiany**: Importy w formularzach

---

## FAZA 3: Layout Rebuild

### [F3-01] Rebuild `layout/Sidebar.tsx` — Unified accent, sliding pill
**Priorytet**: Krytyczny | **Estymata**: L | **Blokuje**: F4
- Usunac 16-kolorowy system iconStyle (linie 96-114)
- Jeden accent color dla active state
- Sliding pill indicator z `layoutId` (Framer Motion)
- Collapsed mode (64px) z spring animation
- Mobile: bottom nav bar (5 pozycji) zamiast hamburger Sheet
- User area z avatar + logout
- **Pliki do zmiany**: `apps/frontend/components/layout/Sidebar.tsx`

### [F3-02] Rebuild `layout/Header.tsx` — Breadcrumb integration
**Priorytet**: Wysoki | **Estymata**: M
- Usunac hardkodowane kolory
- Zintegrowac Breadcrumb (z shared/Breadcrumb)
- Uzyc design tokens na background, borders, notification colors
- Notification dropdown: uzyc modalContentVariants z motion-tokens
- **Pliki do zmiany**: `apps/frontend/components/layout/Header.tsx`

### [F3-03] Update `layout/DashboardLayout.tsx` — Nowe surfaces
**Priorytet**: Wysoki | **Estymata**: S
- Background: `bg-[var(--bg)]` zamiast gradient `from-neutral-50 via-white to-neutral-100/80`
- Loading spinner: uzyc ui/spinner zamiast inline
- Page transition: uzyc pageVariants z motion-tokens
- **Pliki do zmiany**: `apps/frontend/components/layout/DashboardLayout.tsx`

---

## FAZA 4: Migracja modulow

### [F4-01] Dashboard — Usunac emoji, uzyc StatusBadge, nowy StatCard
**Priorytet**: Krytyczny | **Estymata**: M
- Usunac `statusLabels` z emoji (linie 27-48) -> uzyc ui/status-badge
- Usunac `formatDate` (linie 51-61) -> uzyc date-fns
- Usunac `SkeletonCard`/`SkeletonEvent` inline -> uzyc StatCard.isLoading
- Zamienic PageHero -> PageHeader
- Zamienic emoji: `📅` -> Calendar icon, `💰` -> Wallet icon, `⚠️` -> AlertTriangle icon
- Zamienic `statGradients.*` na unified accent
- **Pliki do zmiany**: `apps/frontend/app/dashboard/page.tsx`

### [F4-02] Reservations list — Uzyc design tokens
**Priorytet**: Wysoki | **Estymata**: M
- Zamienic inline status colors na StatusBadge
- Zamienic PageHero -> PageHeader
- **Pliki do zmiany**: `apps/frontend/components/reservations/reservations-list.tsx`

### [F4-03] Reservation detail — Uzyc DetailHeader zamiast custom hero
**Priorytet**: Wysoki | **Estymata**: L
- Zamienic custom `ReservationHero` -> shared/DetailHeader
- Zamienic hardkodowane amber colors -> feedback tokens
- Tab bar -> uzyc ui/tabs
- **Pliki do zmiany**: `apps/frontend/app/dashboard/reservations/[id]/page.tsx`

### [F4-04] Reservation form — FormField wrapper
**Priorytet**: Wysoki | **Estymata**: M
- Client type toggle -> wydzielic do shared komponentu (duplikacja z create-client-modal)
- Card header gradient -> usunac
- **Pliki do zmiany**: `apps/frontend/components/reservations/create-reservation-form.tsx`

### [F4-05] Client detail — Uzyc DetailHeader zamiast custom ClientHeroSection
**Priorytet**: Wysoki | **Estymata**: M
- Zamienic custom hero -> shared/DetailHeader
- Zamienic hardkodowane kolory -> design tokens
- **Pliki do zmiany**: `apps/frontend/app/dashboard/clients/[id]/page.tsx`

### [F4-06] Client card — Uzyc design tokens
**Priorytet**: Sredni | **Estymata**: S
- Avatar gradient -> `bg-accent/10 text-accent`
- Badge colors -> feedback tokens
- **Pliki do zmiany**: `apps/frontend/components/clients/client-card.tsx`

### [F4-07] Client modals — Uzyc FormField + confirm-modal
**Priorytet**: Sredni | **Estymata**: M
- create-client-modal: raw inputs -> FormField wrapper
- delete-client-modal: -> ui/confirm-modal
- Client type toggle: wydzielic shared komponent (reuse w reservation form)
- **Pliki do zmiany**:
  - `apps/frontend/components/clients/create-client-modal.tsx`
  - `apps/frontend/components/clients/delete-client-modal.tsx`

### [F4-08] Hall card — Uzyc design tokens, usunac badge chaos
**Priorytet**: Sredni | **Estymata**: M
- 4 rozne systemy kolorow badge -> StatusBadge + Badge z CVA
- Switch inline bez potwierdzenia -> dodac confirm
- **Pliki do zmiany**: `apps/frontend/components/halls/hall-card.tsx`

### [F4-09] Hall detail — Uzyc DetailHeader
**Priorytet**: Sredni | **Estymata**: S
- Juz uzywa DetailHero -> zamienic na DetailHeader
- **Pliki do zmiany**: `apps/frontend/app/dashboard/halls/[id]/page.tsx`

### [F4-10] Deposits page — PageHeader + design tokens
**Priorytet**: Sredni | **Estymata**: S
- Deposits jest juz wzglednie clean (uzywa tokenow)
- Zamienic PageHero -> PageHeader
- **Pliki do zmiany**: `apps/frontend/app/dashboard/deposits/page.tsx`

### [F4-11] Queue page — Usunac 12+ hardkodowanych kolorow
**Priorytet**: Wysoki | **Estymata**: M
- 3 typy alertow (info/warning/error) z hardkodowanymi kolorami -> uzyc ui/alert lub feedback tokens
- Zamienic PageHero -> PageHeader
- **Pliki do zmiany**: `apps/frontend/app/dashboard/queue/page.tsx`

### [F4-12] Notifications page — Usunac 7+ hardkodowanych typeColors
**Priorytet**: Wysoki | **Estymata**: M
- typeColors mapping (7 typow) -> design tokens lub CVA badge
- Zamienic PageHero -> PageHeader
- **Pliki do zmiany**: `apps/frontend/app/dashboard/notifications/page.tsx`

### [F4-13] Reports page — Usunac hardkodowane TAB_STYLES
**Priorytet**: Wysoki | **Estymata**: M
- TAB_STYLES (4 warianty) -> design tokens
- Zamienic PageHero -> PageHeader
- **Pliki do zmiany**: `apps/frontend/app/dashboard/reports/page.tsx`

### [F4-14] Reports components — Usunac emoji, naprawic dynamic classes
**Priorytet**: Wysoki | **Estymata**: M
- Usunac emoji: `👤`, `🧒`, `📅`, `✨`, `🍽️` -> Lucide icons
- Naprawic `bg-${viewColor}-600` w ReportFilters.tsx (broken Tailwind dynamic classes!)
- Hardkodowane kolory -> feedback/semantic tokens
- **Pliki do zmiany**:
  - `apps/frontend/app/dashboard/reports/components/MenuPreparationsReport.tsx`
  - `apps/frontend/app/dashboard/reports/components/PreparationsReport.tsx`
  - `apps/frontend/app/dashboard/reports/components/RevenueReport.tsx`
  - `apps/frontend/app/dashboard/reports/components/OccupancyReport.tsx`
  - `apps/frontend/app/dashboard/reports/components/ReportFilters.tsx`

### [F4-15] Menu module — Usunac 51+ hardkodowanych kolorow
**Priorytet**: Wysoki | **Estymata**: L
- MenuCard: 5 color sets -> design tokens
- DishCard: 8 color sets -> design tokens
- PackageCard: 11 color sets -> design tokens
- **Pliki do zmiany**:
  - `apps/frontend/components/menu/MenuCard.tsx`
  - `apps/frontend/components/menu/dish-selector/DishCard.tsx`
  - `apps/frontend/components/menu/PackageCard.tsx`
  - + remaining 18 menu components

### [F4-16] Menu page — Usunac hardkodowane nav card gradients
**Priorytet**: Sredni | **Estymata**: S
- 4 gradients (blue, amber, violet, emerald) -> unified accent
- Zamienic PageHero -> PageHeader
- **Pliki do zmiany**: `apps/frontend/app/dashboard/menu/page.tsx`

### [F4-17] Catering OrdersTable — Usunac 11 color sets
**Priorytet**: Wysoki | **Estymata**: M
- Hardkodowane blue/rose/violet/purple kolory -> design tokens
- **Pliki do zmiany**: `apps/frontend/app/dashboard/catering/orders/components/OrdersTable.tsx`

### [F4-18] Catering wizard StepItems — Usunac 9 color sets
**Priorytet**: Sredni | **Estymata**: M
- Hardkodowane green/emerald kolory -> design tokens
- **Pliki do zmiany**: `apps/frontend/app/dashboard/catering/orders/components/wizard/StepItems.tsx`

### [F4-19] Service-extras — Usunac emoji, hardkodowane kolory
**Priorytet**: Sredni | **Estymata**: M
- Emoji: `📁`, `📦` w MobileCategoryCard -> Lucide icons
- Purple colors -> design tokens
- Zamienic PageHero -> PageHeader
- **Pliki do zmiany**:
  - `apps/frontend/app/dashboard/service-extras/page.tsx`
  - `apps/frontend/components/service-extras/category-list/MobileCategoryCard.tsx`
  - `apps/frontend/components/service-extras/ServiceCategoryList.tsx`

### [F4-20] Event-types page — PageHeader + design tokens
**Priorytet**: Niski | **Estymata**: S
- Zamienic PageHero -> PageHeader
- Toggle gradient -> design tokens
- **Pliki do zmiany**: `apps/frontend/app/dashboard/event-types/page.tsx`

### [F4-21] Document-templates page — PageHeader + usunac button gradient
**Priorytet**: Niski | **Estymata**: S
- Zamienic PageHero -> PageHeader
- Button gradient `from-cyan-600 to-blue-600` -> ui/button primary
- **Pliki do zmiany**: `apps/frontend/app/dashboard/document-templates/page.tsx`

### [F4-22] Audit-log page — PageHeader
**Priorytet**: Niski | **Estymata**: S
- Zamienic PageHero -> PageHeader
- Juz wzglednie clean
- **Pliki do zmiany**: `apps/frontend/app/dashboard/audit-log/page.tsx`

### [F4-23] Archive page — PageHeader
**Priorytet**: Niski | **Estymata**: S
- Zamienic PageHero -> PageHeader
- Hardkodowane green colors -> feedback.success token
- **Pliki do zmiany**: `apps/frontend/app/dashboard/archive/page.tsx`

### [F4-24] Settings page — PageHeader
**Priorytet**: Niski | **Estymata**: XS
- Zamienic PageHero -> PageHeader
- Juz clean
- **Pliki do zmiany**: `apps/frontend/app/dashboard/settings/page.tsx`

### [F4-25] Daily-view page — PageHeader
**Priorytet**: Niski | **Estymata**: S
- Zamienic PageHero -> PageHeader
- **Pliki do zmiany**: `apps/frontend/app/dashboard/daily-view/page.tsx`

---

## FAZA 5: Auth Pages + Polish

### [F5-01] Login page — Redesign na design tokens
**Priorytet**: Wysoki | **Estymata**: M
- Usunac violet/purple/indigo gradient background
- Uzyc `bg-[var(--bg)]` jako tlo
- Raw inputs -> FormField + ui/Input
- Button gradient -> ui/Button primary
- Zachowac: error shake animation (dobry UX)
- **Pliki do zmiany**: `apps/frontend/app/login/page.tsx`

### [F5-02] Forgot-password page — Redesign na design tokens
**Priorytet**: Sredni | **Estymata**: M
- Identyczna migracja jak login
- Usunac decorative blurs
- Uzyc FormField + ui/Input
- **Pliki do zmiany**: `apps/frontend/app/forgot-password/page.tsx`

### [F5-03] Reset-password page — Redesign na design tokens
**Priorytet**: Sredni | **Estymata**: M
- Identyczna migracja jak login
- Zachowac: password strength indicators
- **Pliki do zmiany**: `apps/frontend/app/reset-password/page.tsx`

### [F5-04] Dark mode fine-tuning — Przejrzec wszystkie widoki
**Priorytet**: Wysoki | **Estymata**: L
- Otworzyc kazdy widok w dark mode
- Fix kontrast tekstu na ciemnych surface
- Fix border visibility
- Fix semantic colors (success/warning/error) czytelnosc

### [F5-05] Mobile responsiveness — Przejrzec na 375px
**Priorytet**: Wysoki | **Estymata**: L
- Sidebar -> bottom nav bar
- Touch targets min 44x44px
- Overflow na tabelach
- Card grid collapse na 1 kolumne

### [F5-06] Animacje — Verify spojnosc
**Priorytet**: Sredni | **Estymata**: M
- Wszystkie page transitions uzyja pageVariants
- Wszystkie listy uzyja listContainerVariants + listItemVariants
- AnimatePresence na usuwaniu elementow
- Brak animacji > 500ms

---

## STATYSTYKI AUDYTU

| Metryka | Wartosc |
|---------|---------|
| Komponentow przeanalizowanych | 178 |
| Route files przeanalizowanych | 119 |
| Plikow z hardkodowanymi kolorami | 29+ |
| Instancji hardkodowanych kolorow | 100+ |
| Plikow z emoji zamiast ikon | 8 |
| Stron bez design tokenow | 3 (auth pages) |
| Modulow z custom hero zamiast shared | 2 (reservations, clients) |
| Broken code (dynamic Tailwind classes) | 1 (ReportFilters.tsx) |
| Dead code (wrappers bez wartosci) | 1 (deposit-status-badge.tsx) |
| Zadan w backlogu | 37 |
| Krytycznych | 11 |
| Wysokich | 14 |
| Srednich | 9 |
| Niskich | 7 |

---

## LEGENDA

- **Priorytet**: Krytyczny > Wysoki > Sredni > Niski
- **Estymata**: XS (< 1h) | S (1-3h) | M (3-8h) | L (8h+)
- **Blokuje**: ktore zadania sa zablokowane przez to zadanie

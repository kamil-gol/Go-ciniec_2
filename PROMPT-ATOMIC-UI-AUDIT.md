# PROMPT: Atomowy Audyt UI/UX — Premium Visual Overhaul

> **Cel:** Przekształcenie systemu zarządzania eventami z funkcjonalnego MVP w premium-grade produkt klasy Silicon Valley. Każdy moduł ma wyglądać spójnie, nowocześnie i zachwycać użytkownika końcowego.

---

## 0. KONTEKST TECHNICZNY

| Warstwa | Technologia |
|---------|-------------|
| Framework | Next.js 16 + React 19 |
| Styling | Tailwind CSS 3.4 + CSS Variables |
| Komponenty | Shadcn/ui (Radix UI) — styl "new-york" |
| Ikony | Lucide React |
| Animacje | Framer Motion + tailwindcss-animate |
| Wykresy | Recharts |
| Dark mode | next-themes (class strategy) |
| Design tokens | `/lib/design-tokens.ts` |
| Shared components | `/components/shared/` (16 komponentów) |
| UI primitives | `/components/ui/` (35 komponentów) |

**18 modułów w 4 grupach kolorystycznych:**
- **Operations (Navy):** Dashboard, Daily View, Reservations, Clients, Queue, Notifications
- **Finance (Teal):** Deposits, Reports
- **Configuration (Slate):** Settings, Halls, Event Types, Audit Log, Archive, Document Templates
- **Culinary (Amber):** Catering, Menu, Service Extras

---

## 1. ZASADY AUDYTU

### 1.1 Przed rozpoczęciem pracy

```
OBOWIĄZKOWE KROKI WSTĘPNE:
1. Przeczytaj CHANGELOG.md i ostatnie 30 commitów (git log --oneline -30)
2. Sprawdź zamknięte issues na GitHub (gh issue list --state closed --limit 50)
3. Przeczytaj plik /lib/design-tokens.ts — to twój single source of truth
4. Przeczytaj /components/shared/ — każdy plik
5. Przeczytaj /components/ui/card.tsx, button.tsx, badge.tsx, input.tsx
6. Przeczytaj tailwind.config.ts i globals.css
7. NIE DUPLIKUJ pracy, która już została wykonana
```

### 1.2 Filozofia zmian

- **Atomowe commity** — każdy commit = jedna logiczna zmiana (np. "unify card border-radius")
- **Nie łam tego co działa** — zmiany wizualne, nie funkcjonalne
- **Design tokens first** — każda wartość wizualna musi pochodzić z tokenów
- **Mobile-first** — każdy komponent musi wyglądać dobrze na 375px+
- **Dark mode parity** — każda zmiana light = odpowiednik dark

---

## 2. TRENDY I DOBRE PRAKTYKI UI/UX 2025-2026

### 2.1 Bento Grid Layout
```
Zamiast nudnych list i prostych gridów, użyj "bento box" layout:
- Karty o różnych rozmiarach w jednym gridzie
- Większa karta = ważniejsza informacja
- Efekt: Dashboard wygląda jak piękna mozaika, nie Excel
```

### 2.2 Glassmorphism 2.0 (Subtle Glass)
```
NIE agresywny blur na wszystkim. Subtelne glass na:
- Sticky header
- Floating action buttons
- Tooltip / popover backgrounds
- Sidebar overlay na mobile

CSS:
backdrop-filter: blur(12px) saturate(180%);
background: rgba(255, 255, 255, 0.72);
border: 1px solid rgba(255, 255, 255, 0.18);
```

### 2.3 Gradient Mesh & Ambient Backgrounds
```
Zamiast płaskich białych tał:
- Delikatne gradient mesh na hero sections
- Ambient color blobs (blurred circles) w tle dashboard
- Noise texture overlay (2-3% opacity) dla depth
- Radial gradient glow pod kluczowymi elementami

Przykład ambient blob:
.ambient-blob {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  background: var(--module-accent);
}
```

### 2.4 Micro-interactions & Motion Design
```
Każda interakcja użytkownika powinna mieć feedback:
- Hover na kartach: subtle lift (translateY -2px) + shadow expansion
- Kliknięcie przycisku: scale(0.98) na 100ms
- Przejścia między stronami: fade + slide (Framer Motion)
- Loading states: skeleton z shimmer effect
- Success feedback: checkmark animation
- Stagger animations na listach (każdy element 50ms delay)
- Number counters: animate from 0 to value
- Progress bars: smooth width transition
```

### 2.5 Typografia Premium
```
Hierarchia wizualna przez typografię:
- Page title: text-2xl sm:text-3xl font-bold tracking-tight
- Section title: text-lg font-semibold
- Card title: text-base font-semibold
- Body: text-sm leading-relaxed
- Caption/Label: text-xs font-medium uppercase tracking-wider text-muted-foreground
- Stat value: text-3xl font-bold tabular-nums

WAŻNE: Użyj font-feature-settings: "cv02", "cv03", "cv04" dla Inter
(zaokrąglone cyfry, elegantszy styl)
```

### 2.6 Depth & Elevation System
```
3 poziomy elevation zamiast chaotycznych shadow:
Level 0 (flat):    shadow-none, border only
Level 1 (raised):  shadow-sm, bg-card
Level 2 (floating): shadow-lg, bg-card (modals, dropdowns, popovers)

Hover: element przeskakuje o 1 level wyżej
Active: element wraca na swój level

Dark mode shadows:
- Nie shadow (niewidoczne na ciemnym tle)
- Zamiast tego: subtle border glow + lighter bg
```

### 2.7 Color System Premium
```
Nie surowe kolory Tailwind. Stwórz semantic color tokens:

// Surfaces
--surface-primary:    white / neutral-900
--surface-secondary:  neutral-50 / neutral-800
--surface-tertiary:   neutral-100 / neutral-700
--surface-elevated:   white / neutral-800 (z shadow)
--surface-overlay:    white/80 blur / neutral-900/80 blur

// Accents (per module)
--accent-gradient:    from → to
--accent-subtle:      5% opacity tint
--accent-muted:       10% opacity tint
--accent-solid:       full color
--accent-contrast:    white text on accent

// States
--state-hover:        neutral-50 / neutral-700
--state-active:       neutral-100 / neutral-600
--state-selected:     accent-subtle
--state-disabled:     neutral-200 / neutral-700 + opacity-50

// Feedback
--feedback-success:   emerald-500 / emerald-400
--feedback-warning:   amber-500 / amber-400
--feedback-error:     red-500 / red-400
--feedback-info:      blue-500 / blue-400
```

### 2.8 Data Visualization Excellence
```
Wykresy i statystyki muszą być piękne:
- Custom color palette (nie domyślne Recharts)
- Gradient fills pod liniami wykresów
- Animated tooltips z blur background
- Grid lines: dashed, low opacity (10%)
- Axis labels: text-xs text-muted-foreground
- Legend: pills z colored dots, nie prostokąty
- Empty chart state: ilustracja + "Brak danych"
```

### 2.9 Illustrations & Empty States
```
Każdy empty state powinien mieć:
- SVG illustration (nie tylko ikona)
- Przyjazny tekst (nie "Brak wyników")
- CTA button z gradient
- Subtle background pattern

Przykłady tekstów:
- "Jeszcze nie masz rezerwacji. Stwórz pierwszą!" (nie "Lista jest pusta")
- "Twoje menu czeka na pierwsze danie" (nie "Brak dań")
- "Kalendarz jest wolny — czas na nowe eventy!" (nie "Brak wydarzeń")
```

### 2.10 Premium Patterns
```
Detale, które odróżniają produkt premium od zwykłego:

1. Dividers z gradient fade:
   background: linear-gradient(to right, transparent, border-color, transparent);

2. Icon containers z subtle gradient + border:
   bg-gradient-to-br from-accent/10 to-accent/5
   border border-accent/20
   rounded-xl p-2.5

3. Status indicators z pulse animation:
   <span class="relative flex h-3 w-3">
     <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
     <span class="relative rounded-full h-3 w-3 bg-green-500" />
   </span>

4. Card hover z gradient border:
   Transparent → accent gradient na hover

5. Section headers z decorative line:
   Tytuł sekcji | ———————— (gradient line)

6. Numbered steps z connected line:
   ① ——— ② ——— ③ (stepper z gradient line)

7. Avatar stack z overlap:
   Z-index stacking, +N counter dla overflow

8. Toast notifications z progress bar:
   Auto-dismiss timer visible as shrinking bar

9. Smooth page transitions:
   Layout animation, shared element transitions

10. Contextual color coding:
    Kolor akcentu zmienia się z modułem (user CZUJE gdzie jest)
```

---

## 3. ZIDENTYFIKOWANE PROBLEMY (STAN OBECNY)

### 3.1 Krytyczne niespójności

| # | Problem | Gdzie | Impact |
|---|---------|-------|--------|
| 1 | **3 różne border-radius** | UI: rounded-md, Card: rounded-xl, Modules: rounded-2xl | Chaos wizualny |
| 2 | **Przyciski bez jednolitego stylu** | Moduły nadpisują CVA varianty gradient-ami | Każdy moduł wygląda inaczej |
| 3 | **Padding karty niespójny** | p-4, p-5, p-6, p-4 sm:p-6 — mieszane | Brak rytmu wizualnego |
| 4 | **Typography mix** | font-semibold vs font-bold, text-xs vs text-sm na labels | Hierarchia nieczytelna |
| 5 | **Hardcoded kolory** | `bg-amber-50` zamiast design tokens | Dark mode się psuje |
| 6 | **Shadow chaos** | shadow-sm, shadow-md, shadow-lg bez systemu | Brak elevation hierarchy |
| 7 | **Brak responsive tables** | Tylko Deposits ma mobile card view | Tabele nieczytelne na mobile |
| 8 | **Dark mode luki** | Brakujące dark: warianty na statusach | Biały tekst na białym tle |
| 9 | **Brak ilustracji** | Empty states = tylko ikona + tekst | Zimne, nieprzyjazne |
| 10 | **Brak page transitions** | Ostre cut-y między stronami | Amatorskie wrażenie |

### 3.2 Brakujące elementy premium

- Brak ambient backgrounds (płaskie białe tło)
- Brak noise/grain texture
- Brak gradient mesh na hero sections
- Brak animated number counters na statystykach
- Brak skeleton loading z shimmer
- Brak smooth page transitions
- Brak contextual color shifting (sidebar → content)
- Brak floating action buttons
- Brak onboarding / first-use states
- Brak subtle parallax effects

---

## 4. PLAN IMPLEMENTACJI — FAZY

### FAZA 0: Foundation (Design System Hardening)
**Priorytet: KRYTYCZNY — bez tego reszta nie ma sensu**

```
Cel: Single source of truth dla każdej wartości wizualnej

Zadania:
□ 0.1 — Rozbuduj /lib/design-tokens.ts o brakujące tokeny:
    - Surface colors (primary, secondary, tertiary, elevated, overlay)
    - Elevation levels (0, 1, 2) z shadow + bg mappings
    - Semantic states (hover, active, selected, disabled)
    - Feedback colors (success, warning, error, info) z bg/text/border
    - Icon container styles (size S/M/L + gradient)
    - Divider styles (solid, gradient-fade)
    - Typography scale (complete, bez luk)

□ 0.2 — Dodaj CSS variables do globals.css:
    - --surface-*, --accent-*, --state-*, --feedback-*
    - --elevation-0-shadow, --elevation-1-shadow, --elevation-2-shadow
    - --radius-card, --radius-interactive, --radius-pill
    - Pełny dark mode parity

□ 0.3 — Ujednolic border-radius:
    - Interactive elements (buttons, inputs): rounded-lg (0.5rem)
    - Cards, panels: rounded-xl (0.75rem)
    - Hero sections, modals: rounded-2xl (1rem)
    - Pills, tags: rounded-full
    → Zmień w card.tsx, button.tsx, input.tsx, badge.tsx

□ 0.4 — Ujednolic elevation system:
    - Level 0: border border-border, no shadow
    - Level 1: shadow-sm (rest), shadow-md (hover)
    - Level 2: shadow-lg (modals, popovers, dropdowns)
    → Zmień w card.tsx, dialog.tsx, popover.tsx, dropdown-menu.tsx

□ 0.5 — Ujednolic spacing rhythm:
    - Card padding: p-5 sm:p-6 (everywhere)
    - Section gap: space-y-6
    - Grid gap: gap-4 sm:gap-6
    - Page padding: px-4 sm:px-6 lg:px-8
    → Zaktualizuj design-tokens.ts + wszystkie moduły
```

### FAZA 1: Shared Components Upgrade
**Priorytet: WYSOKI — buduje bloki dla modułów**

```
□ 1.1 — PageHero.tsx upgrade:
    - Dodaj ambient gradient blobs w tle
    - Noise texture overlay (subtle)
    - Animated stat counters (number rolls from 0)
    - Breadcrumb integration
    - Module-specific accent jako ambient color

□ 1.2 — StatCard.tsx upgrade:
    - Gradient border on hover (nie tylko shadow)
    - Animated value counter (useCountUp hook)
    - Sparkline mini-chart opcjonalnie
    - Trend arrow z color coding
    - Skeleton loading state z shimmer

□ 1.3 — SectionCard.tsx upgrade:
    - Consistent elevation Level 1
    - Optional accent stripe (left or top border gradient)
    - Collapsible variant (z smooth animation)
    - Header z action slot

□ 1.4 — EmptyState.tsx upgrade:
    - Dedykowane SVG ilustracje per moduł (minimum 8 ilustracji)
    - Friendly copy (nie techniczny język)
    - CTA button z module accent gradient
    - Subtle animated background (floating shapes)

□ 1.5 — LoadingState.tsx upgrade:
    - Skeleton z shimmer effect (gradient animation)
    - Layout-aware: card skeleton, table skeleton, form skeleton
    - Stagger animation na skeleton items
    - Pulsing accent dot loader jako alternatywa

□ 1.6 — GradientCard.tsx upgrade:
    - Mesh gradient tło (nie linear)
    - Glassmorphism variant
    - Animated gradient shift on hover
    - Responsive padding

□ 1.7 — Nowy komponent: PageTransition.tsx
    - Framer Motion AnimatePresence wrapper
    - Fade + slide up animation
    - Layout animation dla smooth reflows
    - Exit animation

□ 1.8 — Nowy komponent: GradientDivider.tsx
    - Horizontal z fade-to-transparent ends
    - Optional label w środku
    - Module-accent variant

□ 1.9 — Nowy komponent: AnimatedCounter.tsx
    - Spring animation od 0 do wartości
    - Formatowanie: number, currency, percentage
    - Intersection Observer trigger (animate on scroll into view)
    - Tabular-nums font variant

□ 1.10 — Nowy komponent: StatusDot.tsx
    - Ping animation dla "active/live" states
    - 4 variants: success, warning, error, neutral
    - Size S/M/L
```

### FAZA 2: Layout & Navigation Premium
**Priorytet: WYSOKI — user widzi to na każdej stronie**

```
□ 2.1 — Sidebar.tsx redesign:
    - Glassmorphism background (subtle blur)
    - Smooth expand/collapse animation
    - Active item: gradient indicator (nie plain border)
    - Hover: subtle bg shift z transition
    - Module group headers z decorative gradient line
    - Collapse do icon-only mode na desktop
    - Animated logo/brand w headerze sidebar
    - Bottom section: user card z avatar + role badge

□ 2.2 — Header.tsx upgrade:
    - Glassmorphism sticky header (blur on scroll)
    - Search bar z command palette (⌘K)
    - Notification bell z badge counter + dropdown
    - User menu z avatar, role, quick actions
    - Breadcrumb trail
    - Smooth opacity transition on scroll

□ 2.3 — DashboardLayout.tsx:
    - Page transition animations (AnimatePresence)
    - Ambient background (module-specific subtle gradient)
    - Smooth sidebar ↔ content reflow
    - Loading bar na górze (NProgress-style)
    - Scroll-to-top button (floating, animated)

□ 2.4 — Mobile navigation:
    - Bottom navigation bar (fixed, 5 items)
    - Swipe gestures dla sidebar
    - Pull-to-refresh animation
    - Safe area insets support
```

### FAZA 3: Module-by-Module Visual Upgrade
**Priorytet: ŚREDNI — moduł po module, atomowo**

```
Dla KAŻDEGO z 18 modułów wykonaj:

□ 3.X.1 — Audit current state:
    - Screenshot current look
    - List inconsistencies vs design system
    - Note hardcoded values

□ 3.X.2 — Apply design tokens:
    - Replace hardcoded colors → token references
    - Apply consistent typography scale
    - Fix border-radius to system values
    - Apply elevation system

□ 3.X.3 — Enhance cards & lists:
    - Card hover effects (lift + shadow)
    - Stagger enter animation
    - Skeleton loading states
    - Empty state z illustration

□ 3.X.4 — Enhance forms:
    - Consistent input styling
    - Label + error message positioning
    - Focus ring z module accent
    - Form section dividers z gradient

□ 3.X.5 — Enhance tables:
    - Responsive: card view on mobile
    - Row hover effect
    - Sortable column headers z indicator
    - Pagination z smooth transition

□ 3.X.6 — Module-specific premium touches:
    - Dashboard: Bento grid, animated counters, mini charts
    - Reservations: Timeline view, color-coded status cards
    - Clients: Avatar stack, contact cards z social links
    - Menu: Visual dish cards z food emoji/icons, drag-reorder
    - Reports: Gradient chart fills, export button z animation
    - Queue: Drag-and-drop z smooth reorder animation
    - Deposits: Payment progress bars, deadline countdown
    - Halls: Visual floor plan hints, capacity indicators
    - Calendar: Heat map coloring, event density visualization
    - Settings: Toggle animations, section cards z icons

Kolejność modułów (od najczęściej używanych):
1. Dashboard (landing page — pierwsze wrażenie)
2. Reservations (core business)
3. Daily View / Calendar
4. Clients
5. Menu (dishes, packages, templates)
6. Queue
7. Deposits
8. Halls
9. Reports
10. Catering
11. Service Extras
12. Event Types
13. Notifications
14. Settings
15. Document Templates
16. Audit Log
17. Archive
```

### FAZA 4: Polish & Delight
**Priorytet: NISKI — cherry on top**

```
□ 4.1 — Micro-interactions:
    - Button click ripple effect
    - Checkbox/switch toggle animations
    - Form validation shake on error
    - Toast notification slide-in z progress bar
    - Copy-to-clipboard z checkmark feedback
    - Dropdown open/close z spring physics

□ 4.2 — Data visualization:
    - Custom Recharts theme (gradient fills, rounded bars)
    - Animated chart entry (draw lines, grow bars)
    - Tooltip z glassmorphism
    - Responsive chart sizing
    - No-data illustration state

□ 4.3 — Loading experience:
    - Route change progress bar (top of page)
    - Optimistic UI updates (instant feedback)
    - Lazy loading z intersection observer
    - Image placeholders z blur-up technique

□ 4.4 — Accessibility + Motion:
    - prefers-reduced-motion support (disable all animations)
    - prefers-contrast support (higher contrast tokens)
    - Focus-visible styling (ring z module accent)
    - Skip-to-content link
    - ARIA live regions dla dynamic content

□ 4.5 — Dark mode polish:
    - Subtle glow effects zamiast shadows
    - Lighter card borders (border-neutral-700/50)
    - Accent colors shifted lighter (+10% lightness)
    - Background noise texture (inverted, lower opacity)
    - Chart colors adjusted for dark backgrounds
```

---

## 5. ZASADY COMMITÓW

```
Każdy commit musi:
1. Być atomowy (1 logiczna zmiana)
2. Mieć prefix: fix(ui): lub feat(ui): lub refactor(ui):
3. Opisywać CO się zmieniło wizualnie
4. NIE łamać istniejącej funkcjonalności
5. Mieć dark mode parity

Przykłady dobrych commitów:
- fix(ui): unify card border-radius to rounded-xl system-wide
- feat(ui): add shimmer skeleton loading component
- refactor(ui): migrate hardcoded colors to design tokens in clients module
- feat(ui): add ambient gradient background to dashboard hero
- fix(ui): dark mode status badge contrast fix

Przykłady ZŁYCH commitów:
- "UI improvements" (za ogólne)
- "Fix styles" (nic nie mówi)
- "Update multiple components" (nie atomowe)
```

---

## 6. WALIDACJA JAKOŚCI

### Checklist per zmiana:
```
□ Light mode wygląda poprawnie
□ Dark mode wygląda poprawnie
□ Mobile (375px) wygląda poprawnie
□ Tablet (768px) wygląda poprawnie
□ Desktop (1280px+) wygląda poprawnie
□ Animacje działają smooth (60fps)
□ prefers-reduced-motion jest obsłużone
□ Nie złamano istniejącej funkcjonalności
□ Hardcoded values → design tokens
□ Commit jest atomowy
```

### Definition of Done per moduł:
```
□ Wszystkie karty używają jednolitego border-radius
□ Wszystkie kolory pochodzą z design tokens
□ Typography scale jest spójna
□ Elevation system jest zastosowany
□ Empty state ma ilustrację i friendly copy
□ Loading state ma skeleton z shimmer
□ Tabele mają mobile card view
□ Formularze mają spójny styling
□ Hover effects na interactive elements
□ Page enter animation działa
□ Dark mode jest kompletny
□ Brak console errors/warnings
```

---

## 7. INSPIRACJE WIZUALNE

```
Produkty do wzorowania się:
- Linear.app — master of micro-interactions, clean layout
- Vercel Dashboard — glassmorphism done right, dark mode excellence
- Stripe Dashboard — data visualization, typography hierarchy
- Notion — content-first design, subtle animations
- Raycast — command palette UX, keyboard-first
- Arc Browser — gradient usage, playful yet professional
- Figma — collaborative UI, contextual toolbars
- Supabase Dashboard — developer-grade polish, green accent system

Kluczowe cechy tych produktów:
1. Spójność na KAŻDEJ stronie
2. Animacje są subtelne ale obecne WSZĘDZIE
3. Kolory są żywe ale nie krzykliwe
4. Ciemny motyw jest RÓWNIE piękny jak jasny
5. Dane są wizualizowane graficznie, nie tylko tekstem
6. Puste stany są przyjazne i zachęcające
7. Loading jest elegancki, nie irytujący
8. Każdy piksel jest przemyślany
```

---

## 8. ANTI-PATTERNS — CZEGO NIE ROBIĆ

```
❌ NIE dodawaj animacji które trwają >500ms (irytujące)
❌ NIE używaj więcej niż 2 fontów
❌ NIE rób gradientów rainbow (max 2-3 kolory, subtle)
❌ NIE dodawaj blur >20px (performance hit)
❌ NIE ukrywaj ważnych akcji za hover-only states
❌ NIE zmieniaj layout on hover (CLS)
❌ NIE używaj transform: scale() na elementach z tekstem >1.05
❌ NIE dodawaj infinite animations (oprócz loading)
❌ NIE hardcoduj kolorów w komponentach — ZAWSZE tokeny
❌ NIE duplikuj stylów — jeśli >2 miejsca, zrób token/komponent
❌ NIE ignoruj dark mode — każda zmiana = light + dark
❌ NIE łam accessibility (min contrast 4.5:1, focus visible)
❌ NIE rób z-index wars (użyj layered system: base/overlay/modal/toast)
```

---

## 9. KOLEJNOŚĆ WYKONANIA (ROADMAP)

```
SPRINT 1 (Foundation):
  → Faza 0: Design System Hardening (0.1–0.5)
  → Faza 1: Core shared components (1.1–1.4)

SPRINT 2 (Layout):
  → Faza 1: Remaining components (1.5–1.10)
  → Faza 2: Layout & Navigation (2.1–2.4)

SPRINT 3 (Core Modules):
  → Faza 3: Dashboard (3.1)
  → Faza 3: Reservations (3.2)
  → Faza 3: Daily View (3.3)

SPRINT 4 (Business Modules):
  → Faza 3: Clients, Menu, Queue (3.4–3.6)

SPRINT 5 (Finance & Config):
  → Faza 3: Deposits, Halls, Reports (3.7–3.9)

SPRINT 6 (Remaining Modules):
  → Faza 3: Catering → Archive (3.10–3.17)

SPRINT 7 (Polish):
  → Faza 4: Micro-interactions, Data Viz, Loading, A11y, Dark mode (4.1–4.5)
```

---

## 10. INSTRUKCJA UŻYCIA TEGO PROMPTA

```
Aby rozpocząć pracę, wklej ten prompt do nowej konwersacji z Claude i dodaj:

"Rozpocznij audyt od Fazy [X]. Pracuj atomowo — jeden commit = jedna zmiana.
Przed każdą zmianą sprawdź git log i closed issues żeby nie duplikować pracy.
Nie buduj lokalnie — podaj komendy do uruchomienia na VPS.
Komunikuj się po polsku."

Jeśli chcesz skupić się na konkretnym module:
"Wykonaj pełny visual upgrade modułu [nazwa] zgodnie z planem z Fazy 3."

Jeśli chcesz tylko foundation:
"Wykonaj Fazę 0 — Design System Hardening. Nic więcej."
```

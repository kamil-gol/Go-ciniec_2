/**
 * Design Tokens — Centralized module color configuration
 * 
 * Each module has a unique accent gradient for identity,
 * but shares the same layout, components, and interaction patterns.
 */

export type ModuleAccent = {
  name: string
  gradient: string          // Hero background gradient
  gradientSubtle: string    // Card/section subtle background
  iconBg: string            // Icon container gradient
  text: string              // Accent text color
  textDark: string          // Accent text color (dark mode)
  ring: string              // Focus ring color
  badge: string             // Badge background
  badgeText: string         // Badge text
}

export const moduleAccents: Record<string, ModuleAccent> = {
  dashboard: {
    name: 'Dashboard',
    gradient: 'from-indigo-600 via-indigo-500 to-purple-600',
    gradientSubtle: 'from-indigo-500/5 via-purple-500/5 to-indigo-500/5',
    iconBg: 'from-indigo-500 to-purple-500',
    text: 'text-indigo-600',
    textDark: 'dark:text-indigo-400',
    ring: 'ring-indigo-500/20',
    badge: 'bg-indigo-100 dark:bg-indigo-900/30',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
  },
  reservations: {
    name: 'Rezerwacje',
    gradient: 'from-blue-600 via-blue-500 to-cyan-600',
    gradientSubtle: 'from-blue-500/5 via-cyan-500/5 to-blue-500/5',
    iconBg: 'from-blue-500 to-cyan-500',
    text: 'text-blue-600',
    textDark: 'dark:text-blue-400',
    ring: 'ring-blue-500/20',
    badge: 'bg-blue-100 dark:bg-blue-900/30',
    badgeText: 'text-blue-700 dark:text-blue-300',
  },
  queue: {
    name: 'Kolejka',
    gradient: 'from-amber-600 via-amber-500 to-orange-600',
    gradientSubtle: 'from-amber-500/5 via-orange-500/5 to-amber-500/5',
    iconBg: 'from-amber-500 to-orange-500',
    text: 'text-amber-600',
    textDark: 'dark:text-amber-400',
    ring: 'ring-amber-500/20',
    badge: 'bg-amber-100 dark:bg-amber-900/30',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
  menu: {
    name: 'Menu',
    gradient: 'from-emerald-600 via-emerald-500 to-teal-600',
    gradientSubtle: 'from-emerald-500/5 via-teal-500/5 to-emerald-500/5',
    iconBg: 'from-emerald-500 to-teal-500',
    text: 'text-emerald-600',
    textDark: 'dark:text-emerald-400',
    ring: 'ring-emerald-500/20',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  clients: {
    name: 'Klienci',
    gradient: 'from-violet-600 via-violet-500 to-purple-600',
    gradientSubtle: 'from-violet-500/5 via-purple-500/5 to-violet-500/5',
    iconBg: 'from-violet-500 to-purple-500',
    text: 'text-violet-600',
    textDark: 'dark:text-violet-400',
    ring: 'ring-violet-500/20',
    badge: 'bg-violet-100 dark:bg-violet-900/30',
    badgeText: 'text-violet-700 dark:text-violet-300',
  },
  settings: {
    name: 'Ustawienia',
    gradient: 'from-neutral-600 via-neutral-500 to-neutral-600',
    gradientSubtle: 'from-neutral-500/5 via-neutral-500/5 to-neutral-500/5',
    iconBg: 'from-neutral-500 to-neutral-500',
    text: 'text-neutral-600',
    textDark: 'dark:text-neutral-400',
    ring: 'ring-neutral-500/20',
    badge: 'bg-neutral-100 dark:bg-neutral-900/30',
    badgeText: 'text-neutral-700 dark:text-neutral-300',
  },
  deposits: {
    name: 'Zaliczki',
    gradient: 'from-rose-600 via-rose-500 to-pink-600',
    gradientSubtle: 'from-rose-500/5 via-pink-500/5 to-rose-500/5',
    iconBg: 'from-rose-500 to-pink-500',
    text: 'text-rose-600',
    textDark: 'dark:text-rose-400',
    ring: 'ring-rose-500/20',
    badge: 'bg-rose-100 dark:bg-rose-900/30',
    badgeText: 'text-rose-700 dark:text-rose-300',
  },
  halls: {
    name: 'Sale',
    gradient: 'from-sky-600 via-sky-500 to-blue-600',
    gradientSubtle: 'from-sky-500/5 via-blue-500/5 to-sky-500/5',
    iconBg: 'from-sky-500 to-blue-500',
    text: 'text-sky-600',
    textDark: 'dark:text-sky-400',
    ring: 'ring-sky-500/20',
    badge: 'bg-sky-100 dark:bg-sky-900/30',
    badgeText: 'text-sky-700 dark:text-sky-300',
  },
  reports: {
    name: 'Raporty',
    gradient: 'from-teal-600 via-teal-500 to-cyan-600',
    gradientSubtle: 'from-teal-500/5 via-cyan-500/5 to-teal-500/5',
    iconBg: 'from-teal-500 to-cyan-500',
    text: 'text-teal-600',
    textDark: 'dark:text-teal-400',
    ring: 'ring-teal-500/20',
    badge: 'bg-teal-100 dark:bg-teal-900/30',
    badgeText: 'text-teal-700 dark:text-teal-300',
  },
  eventTypes: {
    name: 'Typy wydarzeń',
    gradient: 'from-fuchsia-600 via-fuchsia-500 to-pink-600',
    gradientSubtle: 'from-fuchsia-500/5 via-pink-500/5 to-fuchsia-500/5',
    iconBg: 'from-fuchsia-500 to-pink-500',
    text: 'text-fuchsia-600',
    textDark: 'dark:text-fuchsia-400',
    ring: 'ring-fuchsia-500/20',
    badge: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    badgeText: 'text-fuchsia-700 dark:text-fuchsia-300',
  },
  auditLog: {
    name: 'Dziennik Audytu',
    gradient: 'from-zinc-700 via-zinc-600 to-neutral-700',
    gradientSubtle: 'from-zinc-500/5 via-neutral-500/5 to-zinc-500/5',
    iconBg: 'from-zinc-600 to-neutral-600',
    text: 'text-zinc-600',
    textDark: 'dark:text-zinc-400',
    ring: 'ring-zinc-500/20',
    badge: 'bg-zinc-100 dark:bg-zinc-900/30',
    badgeText: 'text-zinc-700 dark:text-zinc-300',
  },
  archive: {
    name: 'Archiwum',
    gradient: 'from-neutral-600 via-neutral-500 to-neutral-600',
    gradientSubtle: 'from-neutral-500/5 via-neutral-500/5 to-neutral-500/5',
    iconBg: 'from-neutral-500 to-neutral-600',
    text: 'text-neutral-600',
    textDark: 'dark:text-neutral-400',
    ring: 'ring-neutral-500/20',
    badge: 'bg-neutral-100 dark:bg-neutral-900/30',
    badgeText: 'text-neutral-700 dark:text-neutral-300',
  },
  serviceExtras: {
    name: 'Usługi dodatkowe',
    gradient: 'from-purple-600 via-violet-600 to-fuchsia-600',
    gradientSubtle: 'from-purple-500/5 via-violet-500/5 to-fuchsia-500/5',
    iconBg: 'from-purple-500 to-fuchsia-500',
    text: 'text-purple-600',
    textDark: 'dark:text-purple-400',
    ring: 'ring-purple-500/20',
    badge: 'bg-purple-100 dark:bg-purple-900/30',
    badgeText: 'text-purple-700 dark:text-purple-300',
  },
  documentTemplates: {
    name: 'Szablony dokumentów',
    gradient: 'from-cyan-600 via-cyan-500 to-blue-600',
    gradientSubtle: 'from-cyan-500/5 via-blue-500/5 to-cyan-500/5',
    iconBg: 'from-cyan-500 to-blue-500',
    text: 'text-cyan-600',
    textDark: 'dark:text-cyan-400',
    ring: 'ring-cyan-500/20',
    badge: 'bg-cyan-100 dark:bg-cyan-900/30',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
  },
} as const

/**
 * Shared spacing & layout constants — mobile-first responsive
 *
 * Spacing scale:
 *   - Section gap: space-y-6 → sm:space-y-8
 *   - Container:   py-6 px-4 → sm:py-8 sm:px-6
 *   - Card padding: p-4 → sm:p-6
 *   - Grid gap:     gap-4 → sm:gap-6
 */
export const layout = {
  /** Standard page container padding — mobile-first */
  containerClass: 'container mx-auto py-6 px-4 sm:py-8 sm:px-6 space-y-6 sm:space-y-8',
  /** Max content width — full dashboard pages */
  maxWidth: 'max-w-7xl',
  /** Max content width — form/detail pages */
  narrowWidth: 'max-w-5xl',
  /** Standard card hover effect */
  cardHover: 'hover:shadow-md hover:-translate-y-1 transition-all duration-300',
  /** Standard section gap — responsive */
  sectionGap: 'space-y-6 sm:space-y-8',
  /** Stats grid — 2col mobile, 4col desktop */
  statGrid: 'grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6',
  /** Card inner padding — responsive */
  cardPadding: 'p-4 sm:p-6',
  /** Detail grid — 2col mobile, 4col desktop */
  detailGrid: 'grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4',
} as const

/**
 * Typography Scale — Unified type system
 *
 * Hierarchy:
 *   1. pageTitle     — main h1 on each dashboard page (inside PageHero)
 *   2. sectionTitle  — section headings within a page
 *   3. cardTitle     — card/panel headers
 *   4. body          — default body text
 *   5. muted         — secondary/helper text
 *   6. label         — form labels
 *
 * Rules:
 *   - Always use `text-foreground` / `text-muted-foreground` (semantic)
 *   - Never hardcode gray-500, neutral-500 etc. for text
 *   - PageHero titles are white (on gradient) — handled separately
 */
export const typography = {
  /** Page title — used in PageHero h1 (white on gradient) */
  pageTitle: 'text-2xl sm:text-4xl font-bold tracking-tight',
  /** Page title — standalone (non-hero) pages */
  pageTitleStandalone: 'text-2xl sm:text-3xl font-bold text-foreground',
  /** Section title — e.g. "Szczegóły rezerwacji", "Podsumowanie" */
  sectionTitle: 'text-lg sm:text-xl font-semibold text-foreground',
  /** Card title — inside Card headers */
  cardTitle: 'text-base font-semibold text-foreground',
  /** Body text — default readable text */
  body: 'text-sm text-foreground',
  /** Muted text — descriptions, helper text, timestamps */
  muted: 'text-sm text-muted-foreground',
  /** Small muted — compact secondary info */
  smallMuted: 'text-xs text-muted-foreground',
  /** Label — form field labels */
  label: 'text-sm font-medium text-foreground',
  /** Hero subtitle — white text on gradient background */
  heroSubtitle: 'text-white/85 text-sm sm:text-lg',
  /** Stat value — large numbers in stat cards */
  statValue: 'text-xl sm:text-2xl font-bold text-foreground',
  /** Stat label — stat card descriptions */
  statLabel: 'text-xs sm:text-sm text-muted-foreground',
} as const

/**
 * Button Variant Tokens — Unified CTA system
 *
 * Variant usage guide:
 *   - primary (default): Main CTA — "Utwórz rezerwację", "Zapisz", "Dodaj"
 *   - secondary:         Secondary action — "Anuluj", "Wróć"
 *   - destructive:       Danger — "Usuń", "Anuluj rezerwację"
 *   - ghost:             Toolbar/inline — icon buttons, filters, toggles
 *   - outline:           Bordered — filter chips, toggles, secondary nav
 *   - link:              Inline links — "Zobacz więcej", "Edytuj"
 *   - gradient:          Premium CTA — hero action buttons only
 *
 * Size usage guide:
 *   - sm:      Toolbar buttons, table row actions, compact UI
 *   - default: Form submit, dialog actions, card CTAs
 *   - lg:      Hero CTA, landing page, onboarding
 *   - icon:    Icon-only buttons (toggle, close, menu)
 *
 * Color system:
 *   - Primary CTA: indigo-600 (via CSS --primary) — consistent across all modules
 *   - Destructive: red-600 — universal danger color
 *   - Secondary/Ghost/Outline: neutral palette — theme-aware
 *   - Focus ring: ring-ring (CSS variable) — accessible focus indicator
 *
 * Dark mode:
 *   - All variants auto-adapt via Tailwind dark: prefixes
 *   - Ghost/outline use neutral-800 hover in dark mode
 *   - Focus ring uses ring-offset-background for proper contrast
 */
export const buttonTokens = {
  /** Primary CTA color — indigo across all modules */
  primaryColor: 'bg-primary-600 hover:bg-primary-700',
  primaryColorDark: 'dark:bg-primary-500 dark:hover:bg-primary-600',
  /** Destructive color */
  destructiveColor: 'bg-red-600 hover:bg-red-700',
  destructiveColorDark: 'dark:bg-red-600 dark:hover:bg-red-700',
  /** Secondary — neutral palette */
  secondaryColor: 'bg-neutral-100 hover:bg-neutral-200',
  secondaryColorDark: 'dark:bg-neutral-800 dark:hover:bg-neutral-700',
  /** Ghost — transparent with hover */
  ghostColor: 'hover:bg-neutral-100',
  ghostColorDark: 'dark:hover:bg-neutral-800',
  /** Outline — bordered */
  outlineColor: 'border-2 border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50',
  outlineColorDark: 'dark:border-neutral-700 dark:hover:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700/50',
  /** Shared focus ring */
  focusRing: 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background',
  /** Shared transition */
  transition: 'transition-all duration-200 active:scale-[0.98]',
} as const

/**
 * Border Radius Scale — Unified rounding system
 *
 *   - Containers (Card, Dialog, Sheet, Hero): rounded-2xl
 *   - Interactive (Button, Input, Select, Textarea): rounded-xl
 *   - Pills (Badge, Tag, Chip): rounded-full
 */
export const radius = {
  container: 'rounded-2xl',
  interactive: 'rounded-xl',
  pill: 'rounded-full',
} as const

/**
 * Shadow Scale — Unified elevation system
 *
 *   - card:    Default card resting state
 *   - cardHover: Card on hover
 *   - modal:   Dialog/Sheet overlay
 *   - none:    Hero sections (gradient bg)
 *
 * Dark mode strategy: shadows → ring borders
 */
export const shadows = {
  card: 'shadow-sm dark:shadow-none dark:ring-1 dark:ring-neutral-700/50',
  cardHover: 'hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/30',
  modal: 'shadow-lg dark:shadow-2xl dark:shadow-black/40',
  hero: 'shadow-none',
} as const

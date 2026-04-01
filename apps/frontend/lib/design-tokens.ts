/**
 * Design Tokens v2 — Unified, surface-based design system
 *
 * ZASADY:
 * 1. Kolory akcent = CSS custom property `--accent` (jeden globalny)
 * 2. Statusy = semantic colors z status-colors.ts
 * 3. Surfaces = CSS variables z globals.css
 * 4. moduleAccents zachowane jako DEPRECATED (backward compat na czas migracji)
 *
 * Po zakończeniu migracji (Faza 4) — usunąć moduleAccents i statGradients.
 */

// ═══════════════════════════════════════════════════════════════
// NOWE TOKENY (używaj tych)
// ═══════════════════════════════════════════════════════════════

// ── Surfaces ─────────────────────────────────────────────────

export const surfaces = {
  /** Tło strony */
  page: 'bg-background',
  /** Karta — border + shadow */
  card: 'bg-card border border-border rounded-xl shadow-sm',
  /** Karta z hover efektem */
  cardHover: 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
  /** Karta podniesiona — shadow-md */
  cardElevated: 'bg-card border border-border rounded-xl shadow-md',
  /** Sekcja — bez shadow, z border */
  section: 'bg-card border border-border rounded-xl p-5',
  /** Overlay na modals */
  overlay: 'bg-background/80 backdrop-blur-sm',
  /** Glass effect — sidebar, header */
  glass: 'bg-background/90 backdrop-blur-xl',
} as const

// ── Typography ───────────────────────────────────────────────

export const typography = {
  /** Tytuł strony (h1) */
  pageTitle: 'text-2xl sm:text-3xl font-bold tracking-tight text-foreground',
  /** Podtytuł strony */
  pageSubtitle: 'text-sm text-muted-foreground',
  /** Tytuł sekcji (h2) */
  sectionTitle: 'text-lg font-semibold text-foreground',
  /** Tytuł karty (h3) */
  cardTitle: 'text-sm font-medium text-foreground',
  /** Body text */
  body: 'text-sm text-foreground',
  /** Muted text */
  muted: 'text-sm text-muted-foreground',
  /** Small muted text */
  small: 'text-xs text-muted-foreground',
  /** Label formularza */
  label: 'text-sm font-medium text-foreground',
  /** Wartość statystyki */
  value: 'text-2xl font-bold text-foreground tabular-nums',
  /** Nagłówek tabeli */
  tableHeader: 'text-xs font-medium uppercase tracking-wider text-muted-foreground',
} as const

// ── Layout ───────────────────────────────────────────────────

export const layout = {
  /** Kontener strony z max-width i padding */
  container: 'mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6',
  /** Wąski kontener (formularze, detail) */
  containerNarrow: 'mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 space-y-6',
  /** Grid 2 kolumny (stat cards, mniejsze) */
  statGrid: 'grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6',
  /** Grid 3 kolumny */
  statGrid3: 'grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6',
  /** Grid 6 kart (dashboard) */
  statGrid6: 'grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5',
  /** Grid kart encji */
  cardGrid2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  cardGrid3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  /** Stos sekcji */
  detailStack: 'space-y-6',
  /** Padding karty */
  cardPadding: 'p-4 sm:p-6',
  /** Grid detali */
  detailGrid: 'grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4',
  /** Gap między sekcjami */
  sectionGap: 'space-y-6 sm:space-y-8',
} as const

// ── Feedback (semantic alerts) ───────────────────────────────

export const feedback = {
  success: 'bg-success-50 text-success-700 dark:bg-success-950/30 dark:text-success-400',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-950/30 dark:text-warning-400',
  error: 'bg-error-50 text-error-700 dark:bg-error-950/30 dark:text-error-400',
  info: 'bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400',
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
} as const

// ── Radius ───────────────────────────────────────────────────

export const radius = {
  container: 'rounded-2xl',
  interactive: 'rounded-xl',
  field: 'rounded-lg',
  pill: 'rounded-full',
} as const

// ── Shadows ──────────────────────────────────────────────────

export const shadows = {
  card: 'shadow-sm dark:shadow-none dark:ring-1 dark:ring-neutral-700/50',
  cardHover: 'hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/30',
  modal: 'shadow-lg dark:shadow-2xl dark:shadow-black/40',
  elevated: 'shadow-md dark:shadow-lg dark:shadow-black/30',
} as const

// ── Button Tokens ────────────────────────────────────────────

export const buttonTokens = {
  primaryColor: 'bg-primary-600 hover:bg-primary-700',
  primaryColorDark: 'dark:bg-primary-500 dark:hover:bg-primary-600',
  destructiveColor: 'bg-red-600 hover:bg-red-700',
  destructiveColorDark: 'dark:bg-red-600 dark:hover:bg-red-700',
  secondaryColor: 'bg-neutral-100 hover:bg-neutral-200',
  secondaryColorDark: 'dark:bg-neutral-800 dark:hover:bg-neutral-700',
  ghostColor: 'hover:bg-neutral-100',
  ghostColorDark: 'dark:hover:bg-neutral-800',
  outlineColor: 'border-2 border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50',
  outlineColorDark: 'dark:border-neutral-700 dark:hover:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700/50',
  focusRing: 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background',
  transition: 'transition-all duration-200 active:scale-[0.98]',
} as const

// ── Animations (CSS-based, nie Framer Motion) ────────────────

export const animations = {
  fadeIn: 'animate-in fade-in duration-200',
  slideUp: 'animate-in slide-in-from-bottom-2 duration-200',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  cardHover: 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
  buttonPress: 'transition-all duration-200 active:scale-[0.98]',
  pageEnter: 'animate-in fade-in slide-in-from-bottom-4 duration-300',
} as const

// ═══════════════════════════════════════════════════════════════
// DEPRECATED — zachowane na czas migracji (Faza 4)
// Po migracji wszystkich stron na PageHeader — usunąć.
// ═══════════════════════════════════════════════════════════════

/** @deprecated Użyj `surfaces` + globalny accent. Będzie usunięte po migracji. */
export type ModuleAccent = {
  name: string
  gradient: string
  gradientSubtle: string
  iconBg: string
  text: string
  textDark: string
  ring: string
  badge: string
  badgeText: string
}

const coreOps = {
  gradient: 'from-[#1e3a5f] via-[#2a4a70] to-[#1e3a5f]',
  gradientSubtle: 'from-blue-900/5 via-slate-800/5 to-blue-900/5',
  iconBg: 'from-[#2a4a70] to-[#1e3a5f]',
  text: 'text-[#1e3a5f]',
  textDark: 'dark:text-blue-300',
  ring: 'ring-blue-800/20',
  badge: 'bg-blue-50 dark:bg-blue-950/30',
  badgeText: 'text-blue-800 dark:text-blue-300',
} as const

const finance = {
  gradient: 'from-[#1a4a4a] via-[#1f5c5c] to-[#1a4a4a]',
  gradientSubtle: 'from-teal-900/5 via-emerald-900/5 to-teal-900/5',
  iconBg: 'from-[#1f5c5c] to-[#1a4a4a]',
  text: 'text-teal-700',
  textDark: 'dark:text-teal-300',
  ring: 'ring-teal-700/20',
  badge: 'bg-teal-50 dark:bg-teal-950/30',
  badgeText: 'text-teal-800 dark:text-teal-300',
} as const

const config = {
  gradient: 'from-[#374151] via-[#475569] to-[#374151]',
  gradientSubtle: 'from-neutral-800/5 via-slate-700/5 to-neutral-800/5',
  iconBg: 'from-[#475569] to-[#374151]',
  text: 'text-slate-600',
  textDark: 'dark:text-slate-300',
  ring: 'ring-slate-500/20',
  badge: 'bg-slate-100 dark:bg-slate-900/30',
  badgeText: 'text-slate-700 dark:text-slate-300',
} as const

const culinary = {
  gradient: 'from-[#7c4a15] via-[#92600a] to-[#7c4a15]',
  gradientSubtle: 'from-amber-900/5 via-yellow-900/5 to-amber-900/5',
  iconBg: 'from-[#92600a] to-[#7c4a15]',
  text: 'text-amber-700',
  textDark: 'dark:text-amber-300',
  ring: 'ring-amber-700/20',
  badge: 'bg-amber-50 dark:bg-amber-950/30',
  badgeText: 'text-amber-800 dark:text-amber-300',
} as const

/** @deprecated Będzie usunięte po migracji na PageHeader */
export const moduleAccents: Record<string, ModuleAccent> = {
  dashboard:         { name: 'Dashboard', ...coreOps },
  dailyView:         { name: 'Widok Dzienny', ...coreOps },
  reservations:      { name: 'Rezerwacje', ...coreOps },
  clients:           { name: 'Klienci', ...coreOps },
  queue:             { name: 'Kolejka', ...coreOps },
  notifications:     { name: 'Powiadomienia', ...coreOps },
  deposits:          { name: 'Zaliczki', ...finance },
  reports:           { name: 'Raporty', ...finance },
  settings:          { name: 'Ustawienia', ...config },
  halls:             { name: 'Sale', ...config },
  eventTypes:        { name: 'Typy wydarzeń', ...config },
  auditLog:          { name: 'Dziennik Audytu', ...config },
  archive:           { name: 'Archiwum', ...config },
  documentTemplates: { name: 'Szablony dokumentów', ...config },
  catering:          { name: 'Catering', ...culinary },
  menu:              { name: 'Menu', ...culinary },
  serviceExtras:     { name: 'Usługi dodatkowe', ...culinary },
} as const

/** @deprecated Użyj surface-based StatCard bez gradient icon backgrounds */
export const statGradients = {
  financial: 'from-amber-500 to-yellow-600',
  count: 'from-blue-600 to-blue-800',
  alert: 'from-rose-500 to-red-600',
  success: 'from-emerald-500 to-teal-600',
  neutral: 'from-zinc-500 to-neutral-600',
  info: 'from-violet-500 to-purple-600',
} as const

/**
 * @deprecated Użyj motionTokens z `@/lib/motion-tokens` zamiast tego.
 * Zachowane dla backward compat.
 */
export const motionTokens = {
  duration: {
    instant: 0.1,
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
  },
  ease: {
    default: 'easeOut' as const,
    smooth: [0.4, 0, 0.2, 1] as const,
  },
  stagger: {
    cards: 0.06,
    list: 0.04,
  },
} as const

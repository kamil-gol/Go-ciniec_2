/**
 * Design Tokens — Centralized module color configuration
 *
 * Modules are grouped into 4 cohesive categories:
 *   1. CORE/OPERATIONS (warm navy)    — dashboard, dailyView, reservations, clients, queue, notifications
 *   2. FINANCE (deep teal-emerald)    — deposits, reports
 *   3. CONFIGURATION (slate-steel)    — settings, halls, eventTypes, auditLog, archive, documentTemplates
 *   4. CULINARY (rich amber-gold)     — catering, menu, serviceExtras
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

// ── Unified hero gradient ─────────────────────────────────────────────────────
// Single cohesive gradient across all modules for visual consistency.
// Subtle per-group identity preserved via text/badge/ring accent colors.

const heroGradient = {
  gradient: 'from-[#1e3a5f] via-[#2a4a70] to-[#1e3a5f]',
  gradientSubtle: 'from-blue-900/5 via-slate-800/5 to-blue-900/5',
  iconBg: 'from-[#2a4a70] to-[#1e3a5f]',
} as const

// ── Group accent helpers ──────────────────────────────────────────────────────

const coreOps = {
  ...heroGradient,
  text: 'text-[#1e3a5f]',
  textDark: 'dark:text-blue-300',
  ring: 'ring-blue-800/20',
  badge: 'bg-blue-50 dark:bg-blue-950/30',
  badgeText: 'text-blue-800 dark:text-blue-300',
} as const

const finance = {
  ...heroGradient,
  text: 'text-teal-700',
  textDark: 'dark:text-teal-300',
  ring: 'ring-teal-700/20',
  badge: 'bg-teal-50 dark:bg-teal-950/30',
  badgeText: 'text-teal-800 dark:text-teal-300',
} as const

const config = {
  ...heroGradient,
  text: 'text-slate-600',
  textDark: 'dark:text-slate-300',
  ring: 'ring-slate-500/20',
  badge: 'bg-slate-100 dark:bg-slate-900/30',
  badgeText: 'text-slate-700 dark:text-slate-300',
} as const

const culinary = {
  ...heroGradient,
  text: 'text-amber-700',
  textDark: 'dark:text-amber-300',
  ring: 'ring-amber-700/20',
  badge: 'bg-amber-50 dark:bg-amber-950/30',
  badgeText: 'text-amber-800 dark:text-amber-300',
} as const

// ── Module accents ─────────────────────────────────────────────────────────────

export const moduleAccents: Record<string, ModuleAccent> = {
  // Group 1: CORE/OPERATIONS
  dashboard: {
    name: 'Dashboard',
    ...coreOps,
  },
  dailyView: {
    name: 'Widok Dzienny',
    ...coreOps,
  },
  reservations: {
    name: 'Rezerwacje',
    ...coreOps,
  },
  clients: {
    name: 'Klienci',
    ...coreOps,
  },
  queue: {
    name: 'Kolejka',
    ...coreOps,
  },
  notifications: {
    name: 'Powiadomienia',
    ...coreOps,
  },

  // Group 2: FINANCE
  deposits: {
    name: 'Zaliczki',
    ...finance,
  },
  reports: {
    name: 'Raporty',
    ...finance,
  },

  // Group 3: CONFIGURATION
  settings: {
    name: 'Ustawienia',
    ...config,
  },
  halls: {
    name: 'Sale',
    ...config,
  },
  eventTypes: {
    name: 'Typy wydarzeń',
    ...config,
  },
  auditLog: {
    name: 'Dziennik Audytu',
    ...config,
  },
  archive: {
    name: 'Archiwum',
    ...config,
  },
  documentTemplates: {
    name: 'Szablony dokumentów',
    ...config,
  },

  // Group 4: CULINARY
  catering: {
    name: 'Catering',
    ...culinary,
  },
  menu: {
    name: 'Menu',
    ...culinary,
  },
  serviceExtras: {
    name: 'Usługi dodatkowe',
    ...culinary,
  },
} as const

// ── Stat card gradients ────────────────────────────────────────────────────────

export const statGradients = {
  financial: 'from-amber-500 to-yellow-600',
  count: 'from-blue-600 to-blue-800',
  alert: 'from-rose-500 to-red-600',
  success: 'from-emerald-500 to-teal-600',
  neutral: 'from-zinc-500 to-neutral-600',
  info: 'from-violet-500 to-purple-600',
} as const

/**
 * Shared spacing & layout constants — mobile-first responsive
 */
export const layout = {
  containerClass: 'container mx-auto py-6 px-4 sm:py-8 sm:px-6 space-y-6 sm:space-y-8',
  maxWidth: 'max-w-7xl',
  narrowWidth: 'max-w-5xl',
  cardHover: 'hover:shadow-md hover:-translate-y-1 transition-all duration-300',
  sectionGap: 'space-y-6 sm:space-y-8',
  statGrid: 'grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6',
  statGrid3: 'grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6',
  statGrid6: 'grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5',
  cardPadding: 'p-4 sm:p-6',
  detailGrid: 'grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4',
} as const

export const typography = {
  pageTitle: 'text-2xl sm:text-4xl font-bold tracking-tight',
  pageTitleStandalone: 'text-2xl sm:text-3xl font-bold text-foreground',
  sectionTitle: 'text-lg sm:text-xl font-semibold text-foreground',
  cardTitle: 'text-base font-semibold text-foreground',
  body: 'text-sm text-foreground',
  muted: 'text-sm text-muted-foreground',
  smallMuted: 'text-xs text-muted-foreground',
  label: 'text-sm font-medium text-foreground',
  heroSubtitle: 'text-white/85 text-sm sm:text-lg',
  statValue: 'text-xl sm:text-2xl font-bold text-foreground',
  statLabel: 'text-xs sm:text-sm text-muted-foreground',
  tableHeader: 'text-xs font-medium uppercase tracking-wider text-muted-foreground',
} as const

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

export const radius = {
  container: 'rounded-2xl',
  interactive: 'rounded-xl',
  pill: 'rounded-full',
} as const

export const shadows = {
  card: 'shadow-sm dark:shadow-none dark:ring-1 dark:ring-neutral-700/50',
  cardHover: 'hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/30',
  modal: 'shadow-lg dark:shadow-2xl dark:shadow-black/40',
  hero: 'shadow-none',
} as const

export const animations = {
  fadeIn: 'animate-in fade-in duration-200',
  slideUp: 'animate-in slide-in-from-bottom-2 duration-200',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  cardHover: 'transition-all duration-300 hover:shadow-md hover:-translate-y-1',
  buttonPress: 'transition-all duration-200 active:scale-[0.98]',
  pageEnter: 'animate-in fade-in slide-in-from-bottom-4 duration-300',
} as const

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

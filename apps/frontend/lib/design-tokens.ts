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
  dailyView: {
    name: 'Widok Dzienny',
    gradient: 'from-slate-700 via-slate-600 to-violet-700',
    gradientSubtle: 'from-slate-500/5 via-violet-500/5 to-slate-500/5',
    iconBg: 'from-slate-600 to-violet-600',
    text: 'text-slate-700',
    textDark: 'dark:text-slate-300',
    ring: 'ring-slate-500/20',
    badge: 'bg-slate-100 dark:bg-slate-900/30',
    badgeText: 'text-slate-700 dark:text-slate-300',
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
  catering: {
    name: 'Catering',
    gradient: 'from-orange-600 via-orange-500 to-amber-600',
    gradientSubtle: 'from-orange-500/5 via-amber-500/5 to-orange-500/5',
    iconBg: 'from-orange-500 to-amber-500',
    text: 'text-orange-600',
    textDark: 'dark:text-orange-400',
    ring: 'ring-orange-500/20',
    badge: 'bg-orange-100 dark:bg-orange-900/30',
    badgeText: 'text-orange-700 dark:text-orange-300',
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
    textDark: 'dark:text-neutral-300',
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
    textDark: 'dark:text-neutral-300',
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
  notifications: {
    name: 'Powiadomienia',
    gradient: 'from-yellow-600 via-yellow-500 to-amber-600',
    gradientSubtle: 'from-yellow-500/5 via-amber-500/5 to-yellow-500/5',
    iconBg: 'from-yellow-500 to-amber-500',
    text: 'text-yellow-600',
    textDark: 'dark:text-yellow-400',
    ring: 'ring-yellow-500/20',
    badge: 'bg-yellow-100 dark:bg-yellow-900/30',
    badgeText: 'text-yellow-700 dark:text-yellow-300',
  },
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

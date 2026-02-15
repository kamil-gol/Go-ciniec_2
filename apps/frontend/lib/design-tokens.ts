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
    gradient: 'from-slate-600 via-slate-500 to-gray-600',
    gradientSubtle: 'from-slate-500/5 via-gray-500/5 to-slate-500/5',
    iconBg: 'from-slate-500 to-gray-500',
    text: 'text-slate-600',
    textDark: 'dark:text-slate-400',
    ring: 'ring-slate-500/20',
    badge: 'bg-slate-100 dark:bg-slate-900/30',
    badgeText: 'text-slate-700 dark:text-slate-300',
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
    gradient: 'from-zinc-700 via-zinc-600 to-slate-700',
    gradientSubtle: 'from-zinc-500/5 via-slate-500/5 to-zinc-500/5',
    iconBg: 'from-zinc-600 to-slate-600',
    text: 'text-zinc-600',
    textDark: 'dark:text-zinc-400',
    ring: 'ring-zinc-500/20',
    badge: 'bg-zinc-100 dark:bg-zinc-900/30',
    badgeText: 'text-zinc-700 dark:text-zinc-300',
  },
} as const

/** Shared spacing & layout constants */
export const layout = {
  /** Standard page container padding */
  containerClass: 'container mx-auto py-8 px-6 space-y-8',
  /** Max content width */
  maxWidth: 'max-w-7xl',
  /** Standard card hover effect */
  cardHover: 'hover:shadow-medium hover:-translate-y-1 transition-all duration-300',
  /** Standard section gap */
  sectionGap: 'space-y-8',
} as const

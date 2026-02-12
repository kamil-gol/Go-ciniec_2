'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  Clock,
  DollarSign,
  Theater,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  LogOut,
  UtensilsCrossed,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { moduleAccents } from '@/lib/design-tokens'

interface NavItem {
  name: string
  href: string
  icon: any
  accentKey: string
  badge?: number | string
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, accentKey: 'dashboard' },
  { name: 'Rezerwacje', href: '/dashboard/reservations', icon: Calendar, accentKey: 'reservations' },
  { name: 'Klienci', href: '/dashboard/clients', icon: Users, accentKey: 'clients' },
  { name: 'Sale', href: '/dashboard/halls', icon: Building2, accentKey: 'halls' },
  { name: 'Menu', href: '/dashboard/menu', icon: UtensilsCrossed, accentKey: 'menu' },
  { name: 'Kolejka', href: '/dashboard/queue', icon: Clock, accentKey: 'queue' },
  { name: 'Zaliczki', href: '/dashboard/deposits', icon: DollarSign, accentKey: 'deposits' },
  { name: 'Typy Wydarzeń', href: '/dashboard/event-types', icon: Theater, accentKey: 'eventTypes' },
  { name: 'Raporty', href: '/dashboard/reports', icon: BarChart3, accentKey: 'reports' },
  { name: 'Ustawienia', href: '/dashboard/settings', icon: Settings, accentKey: 'settings' },
]

interface SidebarProps {
  user?: {
    firstName: string
    lastName: string
    email: string
    role: string
  }
  onLogout?: () => void
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredNav = navigation.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{
        x: 0,
        opacity: 1,
        width: isCollapsed ? '80px' : '280px',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'fixed left-0 top-0 z-40 h-screen',
        'bg-white/90 dark:bg-neutral-900/90',
        'backdrop-blur-xl border-r border-neutral-200/80 dark:border-neutral-700/50',
        'shadow-sm transition-all duration-300'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo & Brand */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-neutral-200/80 dark:border-neutral-700/50">
          <motion.div
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-md flex-shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent whitespace-nowrap">
                Gościniec
              </span>
            )}
          </motion.div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
            aria-label={isCollapsed ? 'Rozwiń menu' : 'Zwiń menu'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
            )}
          </button>
        </div>

        {/* Search Bar */}
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="px-4 py-3"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
              <input
                type="text"
                placeholder="Szukaj... ⌘K"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-neutral-100 dark:bg-neutral-800/80 pl-10 pr-4 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-400/30 transition-all"
              />
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 scrollbar-thin">
          <AnimatePresence>
            {filteredNav.map((item, index) => {
              const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)

              const Icon = item.icon
              const accent = moduleAccents[item.accentKey]

              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ delay: index * 0.04, duration: 0.3 }}
                  className="relative"
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActiveIndicator"
                      className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-gradient-to-b from-indigo-500 to-indigo-400 dark:from-indigo-400 dark:to-indigo-300"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}

                  <Link
                    href={item.href}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-200',
                      isActive ? 'pl-5 pr-3' : 'pl-3 pr-3',
                      isActive
                        ? `bg-gradient-to-r ${accent.gradient} text-white shadow-md`
                        : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 hover:-translate-y-0.5'
                    )}
                  >
                    <Icon className={cn(
                      'h-[18px] w-[18px] flex-shrink-0 transition-transform duration-200',
                      isActive ? '' : 'group-hover:scale-110'
                    )} />

                    {!isCollapsed && (
                      <>
                        <span className="flex-1 truncate">{item.name}</span>

                        {item.badge && (
                          <span className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-semibold',
                            isActive
                              ? 'bg-white/20 text-white'
                              : `${accent.badge} ${accent.badgeText}`
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}

                    {/* Collapsed Tooltip */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 hidden group-hover:flex items-center z-50">
                        <div className="rounded-lg bg-neutral-900 dark:bg-neutral-100 px-3 py-1.5 text-xs font-medium text-white dark:text-neutral-900 shadow-lg whitespace-nowrap">
                          {item.name}
                        </div>
                      </div>
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </nav>

        {/* User Section */}
        <div className="border-t border-neutral-200/80 dark:border-neutral-700/50 p-4">
          {user && (
            <div className={cn(
              'rounded-xl bg-neutral-50 dark:bg-neutral-800/60 p-3',
              'border border-neutral-200/60 dark:border-neutral-700/40'
            )}>
              {!isCollapsed ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-indigo-500 text-white text-sm font-semibold shadow-sm flex-shrink-0">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 active:scale-[0.98] px-4 py-2 text-sm font-medium text-white transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Wyloguj</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={onLogout}
                  className="flex w-full items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 active:scale-[0.98] p-2.5 text-white transition-all duration-200"
                  aria-label="Wyloguj"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  )
}

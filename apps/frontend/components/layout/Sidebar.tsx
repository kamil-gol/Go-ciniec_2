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
  Plus,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: any
  badge?: number | string
  isNew?: boolean
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Rezerwacje', href: '/dashboard/reservations', icon: Calendar },
  { name: 'Klienci', href: '/dashboard/clients', icon: Users, isNew: true },
  { name: 'Sale', href: '/dashboard/halls', icon: Building2, isNew: true },
  { name: 'Kolejka', href: '/dashboard/queue', icon: Clock, badge: 3 },
  { name: 'Zaliczki', href: '/dashboard/deposits', icon: DollarSign, isNew: true },
  { name: 'Typy Wydarzeń', href: '/dashboard/event-types', icon: Theater, isNew: true },
  { name: 'Raporty', href: '/dashboard/reports', icon: BarChart3, isNew: true },
  { name: 'Ustawienia', href: '/dashboard/settings', icon: Settings, isNew: true },
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
        width: isCollapsed ? '80px' : '280px'
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'fixed left-0 top-0 z-40 h-screen',
        'bg-white/80 dark:bg-neutral-900/80',
        'backdrop-blur-xl border-r border-neutral-200 dark:border-neutral-800',
        'shadow-soft transition-all duration-300'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo & Brand */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-neutral-200 dark:border-neutral-800">
          <motion.div
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-hero text-white shadow-glow">
              <Building2 className="h-6 w-6" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Gościniec_2
              </span>
            )}
          </motion.div>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label={isCollapsed ? 'Rozwiń menu' : 'Zwiń menu'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Szukaj... ⌘K"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg bg-neutral-100 dark:bg-neutral-800 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <AnimatePresence>
            {filteredNav.map((item, index) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon

              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-medium'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:scale-[1.02]'
                    )}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-white"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}

                    <Icon className={cn(
                      'h-5 w-5 flex-shrink-0 transition-transform',
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    )} />

                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        
                        {/* Badges */}
                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <span className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-semibold',
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                            )}>
                              {item.badge}
                            </span>
                          )}
                          {item.isNew && (
                            <span className="rounded-full bg-gradient-accent px-2 py-0.5 text-xs font-semibold text-white animate-pulse-glow">
                              ✨
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </nav>

        {/* User Section */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
          {user && (
            <div className={cn(
              'rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 p-4',
              'border border-neutral-200 dark:border-neutral-700 shadow-soft'
            )}>
              {!isCollapsed ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-hero text-white font-semibold shadow-glow">
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
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Wyloguj</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={onLogout}
                  className="flex w-full items-center justify-center rounded-lg bg-error-500 p-2 text-white hover:bg-error-600 transition-all hover:scale-110 active:scale-95"
                  aria-label="Wyloguj"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Add FAB */}
        {!isCollapsed && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="absolute bottom-24 right-4"
          >
            <button
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-accent text-white shadow-hard hover:shadow-glow-lg transition-all hover:scale-110 active:scale-95"
              aria-label="Szybkie dodawanie"
            >
              <Plus className="h-6 w-6" />
            </button>
          </motion.div>
        )}
      </div>
    </motion.aside>
  )
}

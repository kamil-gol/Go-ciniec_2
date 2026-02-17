'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Bell, Search, Moon, Sun, Menu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface HeaderProps {
  user?: {
    firstName: string
    lastName: string
    email: string
    role: string
  }
  onMenuClick?: () => void
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications] = useState([
    { id: 1, title: 'Nowa rezerwacja', message: 'Jan Kowalski - Wesele 15.02', time: '5 min temu', unread: true, link: '/dashboard/reservations' },
    { id: 2, title: 'Płatność otrzymana', message: 'Zaliczka 5,000 zł', time: '1 godz. temu', unread: true, link: '/dashboard/reservations' },
    { id: 3, title: 'Przypomnienie', message: 'Wydarzenie jutro o 18:00', time: '2 godz. temu', unread: false, link: '/dashboard/reservations' },
  ])

  const unreadCount = notifications.filter(n => n.unread).length
  const isDark = resolvedTheme === 'dark'

  // Prevent hydration mismatch — render theme icon only after client mount
  useEffect(() => setMounted(true), [])

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    if (notif.link) {
      router.push(notif.link)
      setShowNotifications(false)
    }
  }

  const handleViewAll = () => {
    router.push('/dashboard/reservations')
    setShowNotifications(false)
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-neutral-200/80 dark:border-neutral-700/50 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left side: Hamburger (mobile) + Welcome */}
        <div className="flex items-center gap-3">
          {/* Hamburger Menu — visible only on mobile (below lg) */}
          <button
            onClick={onMenuClick}
            className="lg:hidden rounded-xl bg-neutral-100 dark:bg-neutral-800/80 p-2.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all duration-200 active:scale-[0.95]"
            aria-label="Otwórz menu nawigacji"
          >
            <Menu className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
          </button>

          {/* Welcome Message — responsive */}
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Witaj, {user?.firstName}! 👋
            </h1>
            <p className="hidden sm:block text-sm text-neutral-500 dark:text-neutral-400">
              {new Date().toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          {/* Search — hidden on small mobile */}
          <button
            className="hidden sm:flex items-center gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all duration-200 hover:-translate-y-0.5"
            aria-label="Szukaj"
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Szukaj...</span>
            <kbd className="hidden md:inline-flex items-center gap-1 rounded-md bg-neutral-200/80 dark:bg-neutral-700 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle — persistent via next-themes */}
          <button
            onClick={toggleTheme}
            className="rounded-xl bg-neutral-100 dark:bg-neutral-800/80 p-2.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all duration-200 hover:-translate-y-0.5"
            aria-label={isDark ? 'Przełącz na jasny motyw' : 'Przełącz na ciemny motyw'}
          >
            {mounted ? (
              <AnimatePresence mode="wait">
                {isDark ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="h-[18px] w-[18px] text-amber-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="h-[18px] w-[18px] text-neutral-600 dark:text-neutral-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <div className="h-[18px] w-[18px]" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-xl bg-neutral-100 dark:bg-neutral-800/80 p-2.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all duration-200 hover:-translate-y-0.5"
              aria-label="Powiadomienia"
            >
              <Bell className="h-[18px] w-[18px] text-neutral-600 dark:text-neutral-400" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-neutral-900"
                >
                  {unreadCount}
                </motion.span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />

                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-neutral-800 shadow-xl border border-neutral-200/80 dark:border-neutral-700/50 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-700/50">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Powiadomienia</h3>
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                            {unreadCount} nowe
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto scrollbar-thin">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={cn(
                            'p-4 border-b border-neutral-100/80 dark:border-neutral-700/30 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors duration-150 cursor-pointer',
                            notif.unread && 'bg-indigo-50/50 dark:bg-indigo-950/10'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                                {notif.title}
                              </p>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                                {notif.message}
                              </p>
                              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                                {notif.time}
                              </p>
                            </div>
                            {notif.unread && (
                              <span className="h-2 w-2 rounded-full bg-indigo-500 dark:bg-indigo-400 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-neutral-100 dark:border-neutral-700/50">
                      <button
                        onClick={handleViewAll}
                        className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                      >
                        Zobacz wszystkie
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}

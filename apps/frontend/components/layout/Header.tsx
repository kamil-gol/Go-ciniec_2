'use client'

import { useState } from 'react'
import { Bell, Search, Moon, Sun } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface HeaderProps {
  user?: {
    firstName: string
    lastName: string
    email: string
    role: string
  }
}

export default function Header({ user }: HeaderProps) {
  const [isDark, setIsDark] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications] = useState([
    { id: 1, title: 'Nowa rezerwacja', message: 'Jan Kowalski - Wesele 15.02', time: '5 min temu', unread: true },
    { id: 2, title: 'Płatność otrzymana', message: 'Zaliczka 5,000 zł', time: '1 godz. temu', unread: true },
    { id: 3, title: 'Przypomnienie', message: 'Wydarzenie jutro o 18:00', time: '2 godz. temu', unread: false },
  ])

  const unreadCount = notifications.filter(n => n.unread).length

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-6">
        {/* Welcome Message */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Witaj, {user?.firstName}! 👋
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {new Date().toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <button
            className="flex items-center gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            aria-label="Szukaj"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Szukaj...</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 text-xs">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-2.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            aria-label="Przełącz motyw"
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 180, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="h-5 w-5 text-amber-500" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -180, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="h-5 w-5 text-neutral-600" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-xl bg-neutral-100 dark:bg-neutral-800 p-2.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              aria-label="Powiadomienia"
            >
              <Bell className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-xs font-semibold text-white animate-pulse-glow">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-white dark:bg-neutral-800 shadow-hard border border-neutral-200 dark:border-neutral-700 overflow-hidden"
                >
                  <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Powiadomienia</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          'p-4 border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer',
                          notif.unread && 'bg-primary-50 dark:bg-primary-900/10'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                              {notif.title}
                            </p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                              {notif.message}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                              {notif.time}
                            </p>
                          </div>
                          {notif.unread && (
                            <span className="h-2 w-2 rounded-full bg-primary-500 flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
                    <button className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                      Zobacz wszystkie
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}

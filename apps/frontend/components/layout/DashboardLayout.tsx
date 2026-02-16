'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Sidebar from './Sidebar'
import Header from './Header'
import { motion } from 'framer-motion'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      router.push('/login')
      return
    }

    setUser({
      firstName: 'Admin',
      lastName: 'System',
      role: 'ADMIN',
      email: 'admin@gosciniecrodzinny.pl',
    })
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    toast.success('Wylogowano pomyślnie')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="h-12 w-12 rounded-full border-4 border-indigo-500 dark:border-indigo-400 border-t-transparent mx-auto"
          />
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Ładowanie...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100/80 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      {/* Sidebar — desktop: fixed 280px, mobile: Sheet */}
      <Sidebar
        user={user}
        onLogout={handleLogout}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area — no left padding on mobile */}
      <div className="pl-0 lg:pl-[280px] transition-all duration-300">
        {/* Header with hamburger on mobile */}
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

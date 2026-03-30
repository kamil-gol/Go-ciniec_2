'use client'

import { type ReactNode, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Sidebar from './Sidebar'
import Header from './Header'
import { motion } from 'framer-motion'
import SessionTimeoutModal from '@/app/dashboard/components/SessionTimeoutModal'
import { apiClient } from '@/lib/api-client'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const handleMobileClose = useCallback(() => setSidebarOpen(false), [])

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const { data } = await apiClient.get('/auth/me')
      setUser(data.data.user)
    } catch {
      // Token invalid/expired — redirect to login
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refreshToken')
      router.push('/login')
      return
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refreshToken')
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
          <p className="text-sm text-neutral-500 dark:text-neutral-300 font-medium">Ładowanie...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100/80 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      {/* Sidebar — desktop: fixed 280px, mobile: Sheet */}
      <Sidebar
        user={user}
        onLogout={handleLogout}
        mobileOpen={sidebarOpen}
        onMobileClose={handleMobileClose}
      />

      {/* Main Content Area — no left padding on mobile */}
      <div className="pl-0 lg:pl-[280px] transition-all duration-300">
        {/* Header with hamburger on mobile */}
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main id="main-content" className="min-h-[calc(100vh-4rem)]">
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Session timeout modal — global for all dashboard pages */}
      <SessionTimeoutModal />
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import {
  ChevronLeft,
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  ClipboardList,
  Settings,
  UtensilsCrossed,
  Clock,
  LogOut,
  DollarSign,
  Theater,
  BarChart3,
  Archive,
  FileText,
  Gift,
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Rezerwacje', href: '/dashboard/reservations', icon: Calendar },
  { name: 'Archiwum', href: '/dashboard/archive', icon: Archive },
  { name: 'Klienci', href: '/dashboard/clients', icon: Users },
  { name: 'Sale', href: '/dashboard/halls', icon: Building2 },
  { name: 'Menu', href: '/dashboard/menu', icon: UtensilsCrossed },
  { name: 'Kolejka', href: '/dashboard/queue', icon: Clock },
  { name: 'Zaliczki', href: '/dashboard/deposits', icon: DollarSign },
  { name: 'Usługi dodatkowe', href: '/dashboard/service-extras', icon: Gift },
  { name: 'Typy Wydarzeń', href: '/dashboard/event-types', icon: Theater },
  { name: 'Dziennik Audytu', href: '/dashboard/audit-log', icon: FileText },
  { name: 'Raporty', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Ustawienia', href: '/dashboard/settings', icon: Settings },
]

/* ============================
   Shared nav list component
   ============================ */
function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200/50 dark:border-blue-800/50'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                )}
              >
                <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-blue-600 dark:text-blue-400')} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/* ============================
   Shared user footer component
   ============================ */
function SidebarUser({
  collapsed,
  user,
  onLogout,
}: {
  collapsed: boolean
  user: { firstName: string; lastName: string; role: string; email?: string } | null
  onLogout: () => void
}) {
  return (
    <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
      <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {user?.role === 'ADMIN' ? 'Administrator' : 'Użytkownik'}
            </p>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onLogout}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            aria-label="Wyloguj"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

/* ============================
   Props matching DashboardLayout
   ============================ */
interface SidebarProps {
  user: { firstName: string; lastName: string; role: string; email?: string } | null
  onLogout: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

/* ============================
   Main Sidebar — default export
   ============================ */
export default function Sidebar({ user, onLogout, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Auto-close mobile sheet on navigation
  useEffect(() => {
    onMobileClose()
  }, [pathname])

  return (
    <>
      {/* ====== DESKTOP SIDEBAR (lg+) ====== */}
      <aside
        className={cn(
          'hidden lg:flex fixed left-0 top-0 z-40 h-screen transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[280px]'
        )}
      >
        <div className="flex h-full w-full flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
          {/* Logo + collapse */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-neutral-100 dark:border-neutral-800">
            {!collapsed && (
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">
                  <ClipboardList className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Gościniec
                  </h1>
                  <p className="text-[10px] text-neutral-400 -mt-0.5">Panel zarządzania</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 p-0 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', collapsed && 'rotate-180')} />
            </Button>
          </div>

          <SidebarNav collapsed={collapsed} />
          <SidebarUser collapsed={collapsed} user={user} onLogout={onLogout} />
        </div>
      </aside>

      {/* ====== MOBILE SIDEBAR (Sheet, <lg) ====== */}
      <Sheet open={mobileOpen} onOpenChange={(open) => { if (!open) onMobileClose() }}>
        <SheetContent
          side="left"
          className="w-[280px] p-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
        >
          <SheetTitle className="sr-only">Menu nawigacji</SheetTitle>

          <div className="flex h-full flex-col">
            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 px-4 py-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Gościniec
                </h1>
                <p className="text-[10px] text-neutral-400 -mt-0.5">Panel zarządzania</p>
              </div>
            </div>

            {/* Nav — always expanded on mobile, close sheet on click */}
            <SidebarNav collapsed={false} onNavigate={onMobileClose} />
            <SidebarUser collapsed={false} user={user} onLogout={onLogout} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

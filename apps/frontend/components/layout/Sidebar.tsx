'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import {
  ChevronLeft,
  ChevronDown,
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
  ScrollText,
  ShoppingBag,
  BookOpen,
} from 'lucide-react'

// ═══ NAV CONFIG ═══

type NavChild = { name: string; href: string; icon: React.ElementType }
type NavItem  = { name: string; href: string; icon: React.ElementType; children?: NavChild[] }

const navItems: NavItem[] = [
  { name: 'Dashboard',          href: '/dashboard',                  icon: LayoutDashboard },
  { name: 'Rezerwacje',         href: '/dashboard/reservations',     icon: Calendar },
  { name: 'Archiwum',           href: '/dashboard/archive',          icon: Archive },
  { name: 'Klienci',            href: '/dashboard/clients',          icon: Users },
  { name: 'Sale',               href: '/dashboard/halls',            icon: Building2 },
  { name: 'Menu',               href: '/dashboard/menu',             icon: UtensilsCrossed },
  {
    name: 'Catering',
    href: '/dashboard/catering',
    icon: ClipboardList,
    children: [
      { name: 'Zamówienia', href: '/dashboard/catering/orders',    icon: ShoppingBag },
      { name: 'Szablony',   href: '/dashboard/catering/templates', icon: BookOpen },
    ],
  },
  { name: 'Kolejka',            href: '/dashboard/queue',            icon: Clock },
  { name: 'Zaliczki',           href: '/dashboard/deposits',         icon: DollarSign },
  { name: 'Usługi dodatkowe',   href: '/dashboard/service-extras',   icon: Gift },
  { name: 'Typy Wydarzeń',      href: '/dashboard/event-types',      icon: Theater },
  { name: 'Szablony dokumentów',href: '/dashboard/document-templates',icon: ScrollText },
  { name: 'Dziennik Audytu',    href: '/dashboard/audit-log',        icon: FileText },
  { name: 'Raporty',            href: '/dashboard/reports',          icon: BarChart3 },
  { name: 'Ustawienia',         href: '/dashboard/settings',         icon: Settings },
]

// ═══ SIDEBAR NAV ═══

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()

  // Auto-open groups where a child is currently active
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const set = new Set<string>()
    navItems.forEach(item => {
      if (item.children?.some(child => pathname.startsWith(child.href))) {
        set.add(item.href)
      }
    })
    return set
  })

  // Keep group open when navigating into a child
  useEffect(() => {
    navItems.forEach(item => {
      if (item.children?.some(child => pathname.startsWith(child.href))) {
        setOpenGroups(prev => new Set([...prev, item.href]))
      }
    })
  }, [pathname])

  const toggleGroup = (href: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(href)) next.delete(href)
      else next.add(href)
      return next
    })
  }

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-1">
        {navItems.map((item) => {
          const isGroupActive = item.children
            ? item.children.some(child => pathname.startsWith(child.href))
            : item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          const isOpen = !collapsed && openGroups.has(item.href)

          // ─── Group (has children, expanded sidebar) ───
          if (item.children && !collapsed) {
            return (
              <li key={item.href}>
                <button
                  type="button"
                  onClick={() => toggleGroup(item.href)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isGroupActive
                      ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200/50 dark:border-blue-800/50'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isGroupActive && 'text-blue-600 dark:text-blue-400')} />
                  <span className="flex-1 text-left">{item.name}</span>
                  <ChevronDown className={cn('h-4 w-4 flex-shrink-0 transition-transform duration-200 text-neutral-400', isOpen && 'rotate-180')} />
                </button>

                {/* Sub-items */}
                {isOpen && (
                  <ul className="mt-1 ml-4 pl-3 border-l border-neutral-200 dark:border-neutral-700 space-y-0.5">
                    {item.children.map(child => {
                      const isChildActive = pathname.startsWith(child.href)
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={onNavigate}
                            className={cn(
                              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                              isChildActive
                                ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20'
                                : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-100'
                            )}
                          >
                            <child.icon className={cn('h-4 w-4 flex-shrink-0', isChildActive && 'text-blue-500 dark:text-blue-400')} />
                            <span>{child.name}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          }

          // ─── Group (collapsed) — icon links to first child ───
          if (item.children && collapsed) {
            return (
              <li key={item.href}>
                <Link
                  href={item.children[0].href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center justify-center rounded-xl px-2 py-2.5 text-sm font-medium transition-all duration-200',
                    isGroupActive
                      ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200/50 dark:border-blue-800/50'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isGroupActive && 'text-blue-600 dark:text-blue-400')} />
                </Link>
              </li>
            )
          }

          // ─── Regular item ───
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  collapsed && 'justify-center px-2',
                  isGroupActive
                    ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200/50 dark:border-blue-800/50'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                )}
              >
                <item.icon className={cn('h-5 w-5 flex-shrink-0', isGroupActive && 'text-blue-600 dark:text-blue-400')} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// ═══ SIDEBAR USER ═══

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

// ═══ MAIN SIDEBAR ═══

interface SidebarProps {
  user: { firstName: string; lastName: string; role: string; email?: string } | null
  onLogout: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ user, onLogout, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

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

            <SidebarNav collapsed={false} onNavigate={onMobileClose} />
            <SidebarUser collapsed={false} user={user} onLogout={onLogout} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

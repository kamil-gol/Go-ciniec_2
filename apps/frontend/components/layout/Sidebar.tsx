'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { spring } from '@/lib/motion-tokens'
import {
  ChevronLeft,
  ChevronDown,
  LayoutDashboard,
  Calendar,
  CalendarDays,
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
  Bell,
} from 'lucide-react'

// ═══ NAV CONFIG ═══

type NavChild = { name: string; href: string; icon: React.ElementType }
type NavItem  = { name: string; href: string; icon: React.ElementType; children?: NavChild[] }
type NavGroup = { label: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    label: 'Operacje',
    items: [
      { name: 'Dashboard',     href: '/dashboard',              icon: LayoutDashboard },
      { name: 'Widok Dzienny', href: '/dashboard/daily-view',   icon: CalendarDays },
      { name: 'Rezerwacje',    href: '/dashboard/reservations', icon: Calendar },
      { name: 'Kolejka',       href: '/dashboard/queue',        icon: Clock },
    ],
  },
  {
    label: 'Zarządzanie',
    items: [
      { name: 'Klienci',  href: '/dashboard/clients',  icon: Users },
      { name: 'Sale',     href: '/dashboard/halls',    icon: Building2 },
      { name: 'Menu',     href: '/dashboard/menu',     icon: UtensilsCrossed },
      {
        name: 'Catering',
        href: '/dashboard/catering',
        icon: ClipboardList,
        children: [
          { name: 'Zamówienia', href: '/dashboard/catering/orders',    icon: ShoppingBag },
          { name: 'Szablony',   href: '/dashboard/catering/templates', icon: BookOpen },
        ],
      },
      { name: 'Zaliczki', href: '/dashboard/deposits', icon: DollarSign },
    ],
  },
  {
    label: 'Konfiguracja',
    items: [
      { name: 'Ustawienia',          href: '/dashboard/settings',           icon: Settings },
      { name: 'Typy Wydarzeń',       href: '/dashboard/event-types',        icon: Theater },
      { name: 'Usługi dodatkowe',    href: '/dashboard/service-extras',     icon: Gift },
      { name: 'Szablony dokumentów', href: '/dashboard/document-templates', icon: ScrollText },
    ],
  },
  {
    label: 'Analiza',
    items: [
      { name: 'Raporty',         href: '/dashboard/reports',       icon: BarChart3 },
      { name: 'Dziennik Audytu', href: '/dashboard/audit-log',     icon: FileText },
      { name: 'Powiadomienia',   href: '/dashboard/notifications', icon: Bell },
      { name: 'Archiwum',        href: '/dashboard/archive',       icon: Archive },
    ],
  },
]

const navItems: NavItem[] = navGroups.flatMap(g => g.items)

// ═══ HELPERS ═══

function isActive(pathname: string, item: NavItem): boolean {
  if (item.children) return item.children.some(c => pathname.startsWith(c.href))
  return item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
}

// ═══ SIDEBAR NAV ═══

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const set = new Set<string>()
    navItems.forEach(item => {
      if (item.children?.some(child => pathname.startsWith(child.href))) {
        set.add(item.href)
      }
    })
    return set
  })

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

  const renderNavItem = (item: NavItem) => {
    const active = isActive(pathname, item)
    const isOpen = !collapsed && openGroups.has(item.href)

    // ─── Group with children (expanded) ───
    if (item.children && !collapsed) {
      return (
        <li key={item.href}>
          <button
            type="button"
            onClick={() => toggleGroup(item.href)}
            className={cn(
              'relative w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 min-h-[40px]',
              active
                ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/30'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            {active && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-primary-600 dark:bg-primary-400"
                transition={spring.snappy}
              />
            )}
            <div className={cn(
              'flex items-center justify-center h-7 w-7 rounded-md flex-shrink-0 transition-colors',
              active
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
                : 'text-muted-foreground'
            )}>
              <item.icon className="h-[18px] w-[18px]" />
            </div>
            <span className="flex-1 text-left">{item.name}</span>
            <ChevronDown className={cn(
              'h-4 w-4 flex-shrink-0 transition-transform duration-200 text-muted-foreground/50',
              isOpen && 'rotate-180'
            )} />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mt-0.5 ml-5 pl-4 border-l border-border/50 space-y-0.5"
              >
                {item.children.map(child => {
                  const childActive = pathname.startsWith(child.href)
                  return (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 min-h-[36px]',
                          childActive
                            ? 'text-primary-700 dark:text-primary-300 bg-primary-50/50 dark:bg-primary-950/20'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        )}
                      >
                        <child.icon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{child.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </li>
      )
    }

    // ─── Group (collapsed) ───
    if (item.children && collapsed) {
      return (
        <li key={item.href}>
          <Link
            href={item.children[0].href}
            onClick={onNavigate}
            title={item.name}
            className={cn(
              'relative flex items-center justify-center rounded-lg p-2 transition-colors duration-150 min-h-[40px]',
              active
                ? 'bg-primary-50 dark:bg-primary-950/30'
                : 'hover:bg-muted/50'
            )}
          >
            {active && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-primary-600 dark:bg-primary-400"
                transition={spring.snappy}
              />
            )}
            <div className={cn(
              'flex items-center justify-center h-8 w-8 rounded-md',
              active
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
                : 'text-muted-foreground'
            )}>
              <item.icon className="h-[18px] w-[18px]" />
            </div>
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
          title={collapsed ? item.name : undefined}
          className={cn(
            'relative group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 min-h-[40px]',
            collapsed && 'justify-center px-2',
            active
              ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/30'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          )}
        >
          {active && (
            <motion.div
              layoutId="nav-indicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-primary-600 dark:bg-primary-400"
              transition={spring.snappy}
            />
          )}
          <div className={cn(
            'flex items-center justify-center rounded-md flex-shrink-0',
            collapsed ? 'h-8 w-8' : 'h-7 w-7',
            active
              ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
              : 'text-muted-foreground'
          )}>
            <item.icon className={cn(collapsed ? 'h-[18px] w-[18px]' : 'h-[18px] w-[18px]')} />
          </div>
          {!collapsed && <span>{item.name}</span>}
        </Link>
      </li>
    )
  }

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {navGroups.map((group, groupIndex) => (
        <div key={group.label}>
          {groupIndex > 0 && (
            <div className="my-3 mx-3 border-t border-border/50" />
          )}
          {!collapsed && (
            <span className="block px-3 py-2 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
              {group.label}
            </span>
          )}
          <ul className="space-y-0.5 mt-0.5">
            {group.items.map(renderNavItem)}
          </ul>
        </div>
      ))}
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
    <div className="border-t border-border p-4">
      <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
        <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-300 font-semibold text-xs flex-shrink-0">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {typeof user?.role === 'object' ? (user?.role as any)?.name : user?.role === 'ADMIN' ? 'Administrator' : user?.role || 'Użytkownik'}
            </p>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onLogout}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
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
  }, [pathname, onMobileClose])

  return (
    <>
      {/* ====== DESKTOP SIDEBAR (lg+) ====== */}
      <aside
        className={cn(
          'hidden lg:flex fixed left-0 top-0 z-40 h-screen',
          collapsed ? 'w-[64px]' : 'w-[260px]'
        )}
        style={{ transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <div className="flex h-full w-full flex-col bg-card border-r border-border">
          {/* Logo + collapse */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-border flex-shrink-0">
            {!collapsed && (
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary-600 dark:bg-primary-500 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-bold text-foreground">
                  Gościniec
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="h-7 w-7 p-0 rounded-md"
              aria-label={collapsed ? 'Rozwiń sidebar' : 'Zwiń sidebar'}
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
        <SheetContent side="left" className="w-[280px] p-0 border-r border-border bg-card">
          <SheetTitle className="sr-only">Menu nawigacji</SheetTitle>
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border flex-shrink-0">
              <div className="h-8 w-8 rounded-lg bg-primary-600 dark:bg-primary-500 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-foreground">
                Gościniec
              </span>
            </div>
            <SidebarNav collapsed={false} onNavigate={onMobileClose} />
            <SidebarUser collapsed={false} user={user} onLogout={onLogout} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { moduleAccents } from '@/lib/design-tokens'
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

type NavChild = { name: string; href: string; icon: React.ElementType; accentKey: string }
type NavItem  = { name: string; href: string; icon: React.ElementType; accentKey: string; children?: NavChild[] }

const navItems: NavItem[] = [
  { name: 'Dashboard',           href: '/dashboard',                    icon: LayoutDashboard, accentKey: 'dashboard' },
  { name: 'Widok Dzienny',       href: '/dashboard/daily-view',         icon: CalendarDays,    accentKey: 'dailyView' },
  { name: 'Rezerwacje',          href: '/dashboard/reservations',       icon: Calendar,        accentKey: 'reservations' },
  { name: 'Archiwum',            href: '/dashboard/archive',            icon: Archive,         accentKey: 'archive' },
  { name: 'Klienci',             href: '/dashboard/clients',            icon: Users,           accentKey: 'clients' },
  { name: 'Sale',                href: '/dashboard/halls',              icon: Building2,       accentKey: 'halls' },
  { name: 'Menu',                href: '/dashboard/menu',               icon: UtensilsCrossed, accentKey: 'menu' },
  {
    name: 'Catering',
    href: '/dashboard/catering',
    icon: ClipboardList,
    accentKey: 'catering',
    children: [
      { name: 'Zamówienia', href: '/dashboard/catering/orders',    icon: ShoppingBag, accentKey: 'catering' },
      { name: 'Szablony',   href: '/dashboard/catering/templates', icon: BookOpen,    accentKey: 'catering' },
    ],
  },
  { name: 'Kolejka',             href: '/dashboard/queue',              icon: Clock,           accentKey: 'queue' },
  { name: 'Zaliczki',            href: '/dashboard/deposits',           icon: DollarSign,      accentKey: 'deposits' },
  { name: 'Usługi dodatkowe',    href: '/dashboard/service-extras',     icon: Gift,            accentKey: 'serviceExtras' },
  { name: 'Typy Wydarzeń',       href: '/dashboard/event-types',        icon: Theater,         accentKey: 'eventTypes' },
  { name: 'Szablony dokumentów', href: '/dashboard/document-templates', icon: ScrollText,      accentKey: 'documentTemplates' },
  { name: 'Powiadomienia',       href: '/dashboard/notifications',      icon: Bell,            accentKey: 'notifications' },
  { name: 'Dziennik Audytu',     href: '/dashboard/audit-log',          icon: FileText,        accentKey: 'auditLog' },
  { name: 'Raporty',             href: '/dashboard/reports',            icon: BarChart3,       accentKey: 'reports' },
  { name: 'Ustawienia',          href: '/dashboard/settings',           icon: Settings,        accentKey: 'settings' },
]

// ═══ ICON COLORS MAP ═══
// Maps accentKey to Tailwind color classes for icons
const iconColors: Record<string, { base: string; active: string; bg: string }> = {
  dashboard:         { base: 'text-indigo-500 dark:text-indigo-400',  active: 'text-indigo-600 dark:text-indigo-300',  bg: 'bg-indigo-500/10 dark:bg-indigo-400/10' },
  dailyView:         { base: 'text-slate-500 dark:text-slate-400',    active: 'text-violet-600 dark:text-violet-300',  bg: 'bg-violet-500/10 dark:bg-violet-400/10' },
  reservations:      { base: 'text-blue-500 dark:text-blue-400',      active: 'text-blue-600 dark:text-blue-300',      bg: 'bg-blue-500/10 dark:bg-blue-400/10' },
  archive:           { base: 'text-neutral-500 dark:text-neutral-400', active: 'text-neutral-700 dark:text-neutral-200', bg: 'bg-neutral-500/10 dark:bg-neutral-400/10' },
  clients:           { base: 'text-violet-500 dark:text-violet-400',  active: 'text-violet-600 dark:text-violet-300',  bg: 'bg-violet-500/10 dark:bg-violet-400/10' },
  halls:             { base: 'text-sky-500 dark:text-sky-400',        active: 'text-sky-600 dark:text-sky-300',        bg: 'bg-sky-500/10 dark:bg-sky-400/10' },
  menu:              { base: 'text-emerald-500 dark:text-emerald-400', active: 'text-emerald-600 dark:text-emerald-300', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10' },
  catering:          { base: 'text-orange-500 dark:text-orange-400',  active: 'text-orange-600 dark:text-orange-300',  bg: 'bg-orange-500/10 dark:bg-orange-400/10' },
  queue:             { base: 'text-amber-500 dark:text-amber-400',    active: 'text-amber-600 dark:text-amber-300',    bg: 'bg-amber-500/10 dark:bg-amber-400/10' },
  deposits:          { base: 'text-rose-500 dark:text-rose-400',      active: 'text-rose-600 dark:text-rose-300',      bg: 'bg-rose-500/10 dark:bg-rose-400/10' },
  serviceExtras:     { base: 'text-purple-500 dark:text-purple-400',  active: 'text-purple-600 dark:text-purple-300',  bg: 'bg-purple-500/10 dark:bg-purple-400/10' },
  eventTypes:        { base: 'text-fuchsia-500 dark:text-fuchsia-400', active: 'text-fuchsia-600 dark:text-fuchsia-300', bg: 'bg-fuchsia-500/10 dark:bg-fuchsia-400/10' },
  documentTemplates: { base: 'text-cyan-500 dark:text-cyan-400',      active: 'text-cyan-600 dark:text-cyan-300',      bg: 'bg-cyan-500/10 dark:bg-cyan-400/10' },
  notifications:     { base: 'text-yellow-500 dark:text-yellow-400',  active: 'text-yellow-600 dark:text-yellow-300',  bg: 'bg-yellow-500/10 dark:bg-yellow-400/10' },
  auditLog:          { base: 'text-zinc-500 dark:text-zinc-400',      active: 'text-zinc-600 dark:text-zinc-300',      bg: 'bg-zinc-500/10 dark:bg-zinc-400/10' },
  reports:           { base: 'text-teal-500 dark:text-teal-400',      active: 'text-teal-600 dark:text-teal-300',      bg: 'bg-teal-500/10 dark:bg-teal-400/10' },
  settings:          { base: 'text-neutral-500 dark:text-neutral-400', active: 'text-neutral-700 dark:text-neutral-200', bg: 'bg-neutral-500/10 dark:bg-neutral-400/10' },
}

// Active item border colors (left accent bar)
const activeBorder: Record<string, string> = {
  dashboard:         'border-l-indigo-500',
  dailyView:         'border-l-violet-500',
  reservations:      'border-l-blue-500',
  archive:           'border-l-neutral-500',
  clients:           'border-l-violet-500',
  halls:             'border-l-sky-500',
  menu:              'border-l-emerald-500',
  catering:          'border-l-orange-500',
  queue:             'border-l-amber-500',
  deposits:          'border-l-rose-500',
  serviceExtras:     'border-l-purple-500',
  eventTypes:        'border-l-fuchsia-500',
  documentTemplates: 'border-l-cyan-500',
  notifications:     'border-l-yellow-500',
  auditLog:          'border-l-zinc-500',
  reports:           'border-l-teal-500',
  settings:          'border-l-neutral-500',
}

// Active text colors
const activeText: Record<string, string> = {
  dashboard:         'text-indigo-700 dark:text-indigo-300',
  dailyView:         'text-violet-700 dark:text-violet-300',
  reservations:      'text-blue-700 dark:text-blue-300',
  archive:           'text-neutral-700 dark:text-neutral-200',
  clients:           'text-violet-700 dark:text-violet-300',
  halls:             'text-sky-700 dark:text-sky-300',
  menu:              'text-emerald-700 dark:text-emerald-300',
  catering:          'text-orange-700 dark:text-orange-300',
  queue:             'text-amber-700 dark:text-amber-300',
  deposits:          'text-rose-700 dark:text-rose-300',
  serviceExtras:     'text-purple-700 dark:text-purple-300',
  eventTypes:        'text-fuchsia-700 dark:text-fuchsia-300',
  documentTemplates: 'text-cyan-700 dark:text-cyan-300',
  notifications:     'text-yellow-700 dark:text-yellow-300',
  auditLog:          'text-zinc-700 dark:text-zinc-300',
  reports:           'text-teal-700 dark:text-teal-300',
  settings:          'text-neutral-700 dark:text-neutral-200',
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

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-0.5">
        {navItems.map((item) => {
          const colors = iconColors[item.accentKey] || iconColors.settings
          const borderColor = activeBorder[item.accentKey] || 'border-l-neutral-500'
          const textColor = activeText[item.accentKey] || 'text-neutral-700 dark:text-neutral-200'

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
                      ? `${colors.bg} ${textColor} border-l-[3px] ${borderColor} pl-[9px]`
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100'
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center h-8 w-8 rounded-lg flex-shrink-0 transition-colors',
                    isGroupActive ? colors.bg : 'group-hover:bg-neutral-100 dark:group-hover:bg-neutral-800'
                  )}>
                    <item.icon className={cn('h-[18px] w-[18px]', isGroupActive ? colors.active : colors.base)} />
                  </div>
                  <span className="flex-1 text-left">{item.name}</span>
                  <ChevronDown className={cn('h-4 w-4 flex-shrink-0 transition-transform duration-200 text-neutral-400', isOpen && 'rotate-180')} />
                </button>

                {isOpen && (
                  <ul className="mt-1 ml-5 pl-4 border-l-2 border-neutral-200/70 dark:border-neutral-700/50 space-y-0.5">
                    {item.children.map(child => {
                      const childColors = iconColors[child.accentKey] || iconColors.settings
                      const childActive = pathname.startsWith(child.href)
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={onNavigate}
                            className={cn(
                              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                              childActive
                                ? `${textColor} ${colors.bg}`
                                : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 hover:text-neutral-800 dark:hover:text-neutral-100'
                            )}
                          >
                            <child.icon className={cn('h-4 w-4 flex-shrink-0', childActive ? childColors.active : childColors.base)} />
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

          // ─── Group (collapsed) ───
          if (item.children && collapsed) {
            return (
              <li key={item.href}>
                <Link
                  href={item.children[0].href}
                  onClick={onNavigate}
                  title={item.name}
                  className={cn(
                    'flex items-center justify-center rounded-xl p-2.5 text-sm font-medium transition-all duration-200',
                    isGroupActive
                      ? `${colors.bg} border-l-[3px] ${borderColor}`
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isGroupActive ? colors.active : colors.base)} />
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
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  collapsed && 'justify-center px-2',
                  isGroupActive
                    ? `${colors.bg} ${textColor} border-l-[3px] ${borderColor} pl-[9px]`
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center h-8 w-8 rounded-lg flex-shrink-0 transition-colors',
                  isGroupActive ? colors.bg : '',
                  collapsed && 'h-auto w-auto'
                )}>
                  <item.icon className={cn(
                    collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]',
                    isGroupActive ? colors.active : colors.base
                  )} />
                </div>
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
    <div className="border-t border-neutral-200/80 dark:border-neutral-700/50 p-4">
      <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-md shadow-indigo-500/20">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {typeof user?.role === 'object' ? (user?.role as any)?.name : user?.role === 'ADMIN' ? 'Administrator' : user?.role || 'Użytkownik'}
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
  }, [pathname, onMobileClose])

  return (
    <>
      {/* ====== DESKTOP SIDEBAR (lg+) ====== */}
      <aside
        className={cn(
          'hidden lg:flex fixed left-0 top-0 z-40 h-screen transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[280px]'
        )}
      >
        <div className="flex h-full w-full flex-col bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-r border-neutral-200/80 dark:border-neutral-800/80">
          {/* Logo + collapse */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-neutral-100/80 dark:border-neutral-800/80">
            {!collapsed && (
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <ClipboardList className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
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
          className="w-[280px] p-0 border-r border-neutral-200/80 dark:border-neutral-800/80 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm"
        >
          <SheetTitle className="sr-only">Menu nawigacji</SheetTitle>

          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2.5 px-4 py-5 border-b border-neutral-100/80 dark:border-neutral-800/80">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
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

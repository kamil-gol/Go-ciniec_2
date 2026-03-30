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
  FolderTree,
  Package,
  Salad,
} from 'lucide-react'

// ═══ NAV CONFIG ═══

type NavChild = { name: string; href: string; icon: React.ElementType; accentKey: string }
type NavItem  = { name: string; href: string; icon: React.ElementType; accentKey: string; children?: NavChild[] }

type NavGroup = { label: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    label: 'Operacje',
    items: [
      { name: 'Dashboard',     href: '/dashboard',              icon: LayoutDashboard, accentKey: 'dashboard' },
      { name: 'Widok Dzienny', href: '/dashboard/daily-view',   icon: CalendarDays,    accentKey: 'dailyView' },
      { name: 'Rezerwacje',    href: '/dashboard/reservations', icon: Calendar,        accentKey: 'reservations' },
      { name: 'Kolejka',       href: '/dashboard/queue',        icon: Clock,           accentKey: 'queue' },
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
      { name: 'Zaliczki', href: '/dashboard/deposits', icon: DollarSign, accentKey: 'deposits' },
    ],
  },
  {
    label: 'Zarządzanie',
    items: [
      { name: 'Klienci',  href: '/dashboard/clients',  icon: Users,           accentKey: 'clients' },
      { name: 'Sale',     href: '/dashboard/halls',    icon: Building2,       accentKey: 'halls' },
      {
        name: 'Menu',
        href: '/dashboard/menu',
        icon: UtensilsCrossed,
        accentKey: 'menu',
        children: [
          { name: 'Szablony Menu',  href: '/dashboard/menu/templates',  icon: BookOpen,   accentKey: 'menu' },
          { name: 'Pakiety',        href: '/dashboard/menu/packages',   icon: Package,    accentKey: 'menu' },
          { name: 'Kategorie Dań',  href: '/dashboard/menu/categories', icon: FolderTree, accentKey: 'menu' },
          { name: 'Biblioteka Dań', href: '/dashboard/menu/dishes',     icon: Salad,      accentKey: 'menu' },
        ],
      },
      { name: 'Typy Wydarzeń',    href: '/dashboard/event-types',    icon: Theater, accentKey: 'eventTypes' },
      { name: 'Usługi dodatkowe', href: '/dashboard/service-extras', icon: Gift,    accentKey: 'serviceExtras' },
    ],
  },
  {
    label: 'Analiza',
    items: [
      { name: 'Raporty',         href: '/dashboard/reports',       icon: BarChart3, accentKey: 'reports' },
      { name: 'Dziennik Audytu', href: '/dashboard/audit-log',     icon: FileText,  accentKey: 'auditLog' },
      { name: 'Powiadomienia',   href: '/dashboard/notifications', icon: Bell,      accentKey: 'notifications' },
      { name: 'Archiwum',        href: '/dashboard/archive',       icon: Archive,   accentKey: 'archive' },
    ],
  },
  {
    label: 'Konfiguracja',
    items: [
      { name: 'Szablony dokumentów', href: '/dashboard/document-templates', icon: ScrollText, accentKey: 'documentTemplates' },
      { name: 'Ustawienia',          href: '/dashboard/settings',           icon: Settings,   accentKey: 'settings' },
    ],
  },
]

// Flat list for legacy helpers
const navItems: NavItem[] = navGroups.flatMap(g => g.items)

// ═══ ICON STYLE MAP ═══
// 4 color groups matching nav sections: Operacje (blue), Zarządzanie (emerald), Konfiguracja (slate), Analiza (amber)
type IconStyleConfig = { icon: string; iconActive: string; pill: string; pillActive: string; text: string; activeBg: string; border: string }

const groupOps: IconStyleConfig = { icon: 'text-blue-600 dark:text-blue-400', iconActive: 'text-white', pill: 'bg-blue-100 dark:bg-blue-900/40', pillActive: 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/30', text: 'text-blue-700 dark:text-blue-300', activeBg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-l-blue-500' }
const groupMgmt: IconStyleConfig = { icon: 'text-emerald-600 dark:text-emerald-400', iconActive: 'text-white', pill: 'bg-emerald-100 dark:bg-emerald-900/40', pillActive: 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300', activeBg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-l-emerald-500' }
const groupCfg: IconStyleConfig = { icon: 'text-slate-600 dark:text-slate-400', iconActive: 'text-white', pill: 'bg-slate-200 dark:bg-slate-700/50', pillActive: 'bg-gradient-to-br from-slate-500 to-slate-700 shadow-md shadow-slate-500/30', text: 'text-slate-700 dark:text-slate-300', activeBg: 'bg-slate-100 dark:bg-slate-800/50', border: 'border-l-slate-500' }
const groupAnalysis: IconStyleConfig = { icon: 'text-amber-600 dark:text-amber-400', iconActive: 'text-white', pill: 'bg-amber-100 dark:bg-amber-900/40', pillActive: 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-500/30', text: 'text-amber-700 dark:text-amber-300', activeBg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-l-amber-500' }

const iconStyle: Record<string, IconStyleConfig> = {
  // Operacje
  dashboard: groupOps,
  dailyView: groupOps,
  reservations: groupOps,
  queue: groupOps,
  catering: groupOps,
  deposits: groupOps,
  // Zarządzanie
  clients: groupMgmt,
  halls: groupMgmt,
  menu: groupMgmt,
  eventTypes: groupMgmt,
  serviceExtras: groupMgmt,
  // Analiza
  reports: groupAnalysis,
  auditLog: groupAnalysis,
  notifications: groupAnalysis,
  archive: groupAnalysis,
  // Konfiguracja
  documentTemplates: groupCfg,
  settings: groupCfg,
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
    const s = iconStyle[item.accentKey] ?? iconStyle.settings ?? groupCfg

    const isItemActive = item.children
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
              'w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 min-h-[44px]',
              isItemActive
                ? `${s.activeBg} ${s.text} border-l-[3px] ${s.border} pl-[9px]`
                : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100'
            )}
          >
            <div className={cn(
              'flex items-center justify-center h-8 w-8 rounded-lg flex-shrink-0 transition-all duration-200',
              isItemActive ? s.pillActive : s.pill
            )}>
              <item.icon className={cn('h-[18px] w-[18px]', isItemActive ? s.iconActive : s.icon)} />
            </div>
            <span className="flex-1 text-left">{item.name}</span>
            <ChevronDown className={cn('h-4 w-4 flex-shrink-0 transition-transform duration-200 text-neutral-500', isOpen && 'rotate-180')} />
          </button>

          {isOpen && (
            <ul className="mt-1 ml-5 pl-4 border-l-2 border-neutral-200/70 dark:border-neutral-700/50 space-y-0.5">
              {item.children.map(child => {
                const cs = iconStyle[child.accentKey] || iconStyle.settings
                const childActive = pathname.startsWith(child.href)
                return (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 min-h-[44px]',
                        childActive
                          ? `${s.text} ${s.activeBg}`
                          : 'text-neutral-500 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 hover:text-neutral-800 dark:hover:text-neutral-100'
                      )}
                    >
                      <div className={cn(
                        'flex items-center justify-center h-6 w-6 rounded-md flex-shrink-0',
                        childActive ? cs.pillActive : cs.pill
                      )}>
                        <child.icon className={cn('h-3.5 w-3.5', childActive ? cs.iconActive : cs.icon)} />
                      </div>
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
              'flex items-center justify-center rounded-xl p-2 transition-all duration-200 min-h-[44px]',
              isItemActive
                ? `${s.activeBg} border-l-[3px] ${s.border}`
                : 'hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60'
            )}
          >
            <div className={cn(
              'flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-200',
              isItemActive ? s.pillActive : s.pill
            )}>
              <item.icon className={cn('h-5 w-5', isItemActive ? s.iconActive : s.icon)} />
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
            'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 min-h-[44px]',
            collapsed && 'justify-center px-2',
            isItemActive
              ? `${s.activeBg} ${s.text} border-l-[3px] ${s.border} pl-[9px]`
              : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100'
          )}
        >
          <div className={cn(
            'flex items-center justify-center rounded-lg flex-shrink-0 transition-all duration-200',
            collapsed ? 'h-9 w-9' : 'h-8 w-8',
            isItemActive ? s.pillActive : s.pill
          )}>
            <item.icon className={cn(
              collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]',
              isItemActive ? s.iconActive : s.icon
            )} />
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
            <div className="my-2 mx-3 border-t border-neutral-200/50 dark:border-neutral-700/30" />
          )}
          {!collapsed && (
            <span className="block px-3 py-2 text-[10px] font-semibold text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">
              {group.label}
            </span>
          )}
          <ul className="space-y-1 mt-1">
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
            <p className="text-xs text-neutral-500 dark:text-neutral-300 truncate">
              {typeof user?.role === 'object' ? (user?.role as any)?.name : user?.role === 'ADMIN' ? 'Administrator' : user?.role || 'Użytkownik'}
            </p>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onLogout}
            className="rounded-lg p-1.5 text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                  <p className="text-[10px] text-neutral-500 -mt-0.5">Panel zarządzania</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 p-0 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
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
                <p className="text-[10px] text-neutral-500 -mt-0.5">Panel zarządzania</p>
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

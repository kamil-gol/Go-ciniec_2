'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Gift,
  ScrollText,
  FileText,
  Settings,
  Archive,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Building2,
  UtensilsCrossed,
  ClipboardList,
} from 'lucide-react';

// ── Nav item types ─────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: 'Catering',
    href: '/dashboard/catering',
    icon: <UtensilsCrossed className="h-4 w-4" />,
    children: [
      {
        label: 'Szablony',
        href: '/dashboard/catering/templates',
        icon: <UtensilsCrossed className="h-4 w-4" />,
      },
      {
        label: 'Zamówienia',
        href: '/dashboard/catering/orders',
        icon: <ClipboardList className="h-4 w-4" />,
      },
    ],
  },
  {
    label: 'Usługi dodatkowe',
    href: '/dashboard/service-extras',
    icon: <Gift className="h-4 w-4" />,
  },
  {
    label: 'Audit log',
    href: '/dashboard/audit-log',
    icon: <ScrollText className="h-4 w-4" />,
  },
  {
    label: 'Szablony dokumentów',
    href: '/dashboard/document-templates',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    label: 'Ustawienia',
    href: '/dashboard/settings',
    icon: <Settings className="h-4 w-4" />,
    children: [
      {
        label: 'Firma',
        href: '/dashboard/settings/company',
        icon: <Building2 className="h-4 w-4" />,
      },
      {
        label: 'Archiwizacja',
        href: '/dashboard/settings/archive',
        icon: <Archive className="h-4 w-4" />,
      },
    ],
  },
];

// ── Component ───────────────────────────────────────────

export default function DashboardNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    const expanded: string[] = [];
    for (const item of NAV_ITEMS) {
      if (item.children?.some((child) => pathname.startsWith(child.href))) {
        expanded.push(item.label);
      }
    }
    return expanded;
  });

  const toggleSection = (label: string) => {
    setExpandedSections((prev) =>
      prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const renderItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.label);

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleSection(item.label)}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
              item.children!.some((c) => isActive(c.href))
                ? 'text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              {item.icon}
              {item.label}
            </span>
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
              {item.children!.map((child) => renderItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          isActive(item.href)
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }`}
      >
        {item.icon}
        {item.label}
      </Link>
    );
  };

  const navContent = (
    <nav className="flex flex-col gap-1 p-4">
      <div className="mb-4 px-3">
        <h2 className="text-lg font-bold tracking-tight">Gościniec</h2>
        <p className="text-xs text-muted-foreground">Panel zarządzania</p>
      </div>
      <div className="space-y-1">
        {NAV_ITEMS.map((item) => renderItem(item))}
      </div>
    </nav>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 rounded-md border bg-background p-2 shadow-sm lg:hidden"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r bg-background transition-transform duration-200 lg:relative lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>
    </>
  );
}

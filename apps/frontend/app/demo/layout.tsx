/**
 * Demo Layout
 * 
 * Shared layout for all demo pages
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* Back to Home */}
      <div className="fixed left-4 top-4 z-50">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-lg transition-colors hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
      </div>

      {children}
    </div>
  );
}

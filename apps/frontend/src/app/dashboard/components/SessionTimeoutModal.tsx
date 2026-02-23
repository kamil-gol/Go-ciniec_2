'use client';

/**
 * ⏰ SessionTimeoutModal — Ostrzeżenie o wygaśnięciu sesji (#145)
 *
 * Wyświetla modal z odliczaniem gdy użytkownik jest bezczynny.
 * - "Przedłuż sesję" → wywołuje refresh tokena
 * - "Wyloguj" → natychmiastowe wylogowanie
 * - Po upływie czasu → automatyczne wylogowanie + redirect
 */
import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { useIdleTimer } from '@/hooks/use-idle-timer';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// ═════════════════════════════════════════════
// LOCAL STORAGE KEYS
// ═════════════════════════════════════════════
const LS_ACCESS_TOKEN = 'token';
const LS_REFRESH_TOKEN = 'refreshToken';

export default function SessionTimeoutModal() {
  const router = useRouter();

  // ═══ Logout logic ═══
  const handleLogout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem(LS_REFRESH_TOKEN);
      if (refreshToken) {
        await axios.post(`${API_URL}/auth/logout`, { refreshToken }).catch(() => {});
      }
    } finally {
      localStorage.removeItem(LS_ACCESS_TOKEN);
      localStorage.removeItem(LS_REFRESH_TOKEN);
      router.push('/login');
    }
  }, [router]);

  // ═══ Refresh logic ═══
  const handleRefresh = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem(LS_REFRESH_TOKEN);
      if (!refreshToken) {
        handleLogout();
        return;
      }

      const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      localStorage.setItem(LS_ACCESS_TOKEN, accessToken);
      localStorage.setItem(LS_REFRESH_TOKEN, newRefreshToken);

      // Reset idle timer (handled by return value)
      idleTimer.reset();
    } catch {
      // Refresh failed — force logout
      handleLogout();
    }
  }, [handleLogout]);

  // ═══ Idle timer ═══
  const idleTimer = useIdleTimer({
    idleTimeout: 14 * 60 * 1000,  // 14 min (access token = 15min)
    warningBefore: 60 * 1000,      // 60s warning
    onIdle: handleLogout,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem(LS_ACCESS_TOKEN),
  });

  const { isWarning, remainingSeconds } = idleTimer;

  // ═══ Timer ring progress ═══
  const maxSeconds = 60;
  const progress = remainingSeconds != null ? remainingSeconds / maxSeconds : 1;
  const circumference = 2 * Math.PI * 45; // r=45
  const dashOffset = circumference * (1 - progress);

  return (
    <AlertDialog.Root open={isWarning}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0" />
        <AlertDialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2
                     rounded-2xl border border-orange-200 bg-white p-8 shadow-2xl
                     animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]
                     dark:border-orange-800 dark:bg-gray-900"
        >
          {/* Timer ring */}
          <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center">
            <svg className="-rotate-90" width="112" height="112" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Progress circle */}
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className={`transition-all duration-1000 ease-linear ${
                  (remainingSeconds ?? 60) <= 10
                    ? 'text-red-500'
                    : (remainingSeconds ?? 60) <= 30
                      ? 'text-orange-500'
                      : 'text-amber-400'
                }`}
              />
            </svg>
            <span className="absolute text-3xl font-bold tabular-nums text-gray-900 dark:text-white">
              {remainingSeconds ?? 0}
            </span>
          </div>

          {/* Title */}
          <AlertDialog.Title className="mb-2 text-center text-xl font-semibold text-gray-900 dark:text-white">
            <Clock className="mb-1 inline-block h-5 w-5 text-orange-500" />{' '}
            Sesja wygasa
          </AlertDialog.Title>

          {/* Description */}
          <AlertDialog.Description className="mb-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Z powodu braku aktywności Twoja sesja wygaśnie za{' '}
            <strong className="text-gray-900 dark:text-white">
              {remainingSeconds ?? 0} sekund
            </strong>.
            Kliknij &bdquo;Przedłuż sesję&rdquo;, aby kontynuować pracę.
          </AlertDialog.Description>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <AlertDialog.Action asChild>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-2.5
                           text-sm font-medium text-white shadow-sm transition-colors
                           hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                           dark:focus:ring-offset-gray-900"
              >
                <RefreshCw className="h-4 w-4" />
                Przedłuż sesję
              </button>
            </AlertDialog.Action>

            <AlertDialog.Cancel asChild>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-2.5
                           text-sm font-medium text-gray-700 shadow-sm transition-colors
                           hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
                           dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700
                           dark:focus:ring-offset-gray-900"
              >
                <LogOut className="h-4 w-4" />
                Wyloguj
              </button>
            </AlertDialog.Cancel>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

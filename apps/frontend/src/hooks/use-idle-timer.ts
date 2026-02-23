/**
 * 💤 useIdleTimer — Session idle detection hook (#145)
 *
 * Wykrywa brak aktywności użytkownika i wywołuje callbacki:
 * - onWarning: gdy pozostało `warningBefore` sekund do wygaśnięcia
 * - onIdle: gdy czas bezczynności minął
 *
 * Nasłuchuje: mousemove, keydown, scroll, touchstart, click
 * Throttle: 1s (nie bombarduje state'a przy każdym pikselu myszy)
 */
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseIdleTimerOptions {
  /** Całkowity czas bezczynności w ms (default: 14 min = 840000) */
  idleTimeout?: number;
  /** Ile ms przed idle wywołać onWarning (default: 60s = 60000) */
  warningBefore?: number;
  /** Callback gdy użytkownik wchodzi w strefę ostrzeżenia */
  onWarning?: () => void;
  /** Callback gdy czas bezczynności minął */
  onIdle?: () => void;
  /** Czy timer jest aktywny (default: true) */
  enabled?: boolean;
}

interface UseIdleTimerReturn {
  /** Czy użytkownik jest bezczynny (czas minął) */
  isIdle: boolean;
  /** Czy wyświetlać ostrzeżenie */
  isWarning: boolean;
  /** Ile sekund pozostało do idle (null jeśli nie w strefie warning) */
  remainingSeconds: number | null;
  /** Ręczny reset timera */
  reset: () => void;
  /** Wstrzymaj timer (np. modal otwarty) */
  pause: () => void;
  /** Wznów timer */
  resume: () => void;
}

const IDLE_EVENTS = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'] as const;
const THROTTLE_MS = 1000;

export function useIdleTimer({
  idleTimeout = 14 * 60 * 1000, // 14 min
  warningBefore = 60 * 1000,     // 60s warning
  onWarning,
  onIdle,
  enabled = true,
}: UseIdleTimerOptions = {}): UseIdleTimerReturn {
  const [isIdle, setIsIdle] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const pausedRef = useRef(false);
  const onWarningRef = useRef(onWarning);
  const onIdleRef = useRef(onIdle);

  // Keep callback refs fresh without re-triggering effects
  useEffect(() => {
    onWarningRef.current = onWarning;
  }, [onWarning]);

  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startTimers = useCallback(() => {
    clearAllTimers();
    lastActivityRef.current = Date.now();

    setIsIdle(false);
    setIsWarning(false);
    setRemainingSeconds(null);

    const warningDelay = idleTimeout - warningBefore;

    // Warning timer — fires `warningBefore` ms before idle
    warningTimerRef.current = setTimeout(() => {
      if (pausedRef.current) return;

      setIsWarning(true);
      onWarningRef.current?.();

      // Start countdown
      let secondsLeft = Math.ceil(warningBefore / 1000);
      setRemainingSeconds(secondsLeft);

      countdownRef.current = setInterval(() => {
        secondsLeft -= 1;
        setRemainingSeconds(secondsLeft);

        if (secondsLeft <= 0 && countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      }, 1000);
    }, warningDelay);

    // Idle timer — fires when idle timeout is fully elapsed
    idleTimerRef.current = setTimeout(() => {
      if (pausedRef.current) return;

      setIsIdle(true);
      setIsWarning(false);
      setRemainingSeconds(0);
      onIdleRef.current?.();
    }, idleTimeout);
  }, [idleTimeout, warningBefore, clearAllTimers]);

  const reset = useCallback(() => {
    pausedRef.current = false;
    startTimers();
  }, [startTimers]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    clearAllTimers();
  }, [clearAllTimers]);

  const resume = useCallback(() => {
    pausedRef.current = false;
    startTimers();
  }, [startTimers]);

  // Event listener with throttle
  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      return;
    }

    let throttleTimer: ReturnType<typeof setTimeout> | null = null;

    const handleActivity = () => {
      if (pausedRef.current) return;

      // Throttle: ignore events within THROTTLE_MS of last reset
      const now = Date.now();
      if (now - lastActivityRef.current < THROTTLE_MS) return;

      // Don't reset if already fully idle (user must re-login)
      if (isIdle) return;

      startTimers();
    };

    // Start initial timers
    startTimers();

    // Attach event listeners
    IDLE_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      IDLE_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [enabled, isIdle, startTimers, clearAllTimers]);

  return {
    isIdle,
    isWarning,
    remainingSeconds,
    reset,
    pause,
    resume,
  };
}

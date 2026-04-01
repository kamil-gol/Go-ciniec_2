/**
 * Motion Design System — Spójne animacje w całej aplikacji
 *
 * Reguły:
 * - Żadna animacja > 500ms
 * - Żaden stagger delay > 600ms total
 * - Spring dla interakcji (modal, hover), ease dla transitions (page, fade)
 * - prefers-reduced-motion respektowane przez Framer Motion automatycznie
 */

// ── Springs ──────────────────────────────────────────────────

export const spring = {
  /** Delikatny — modals, dropdowns */
  gentle: { type: 'spring' as const, stiffness: 260, damping: 28 },
  /** Szybki — hover states, tooltips */
  snappy: { type: 'spring' as const, stiffness: 400, damping: 30 },
  /** Sprężysty — badge entrance, notification pop */
  bouncy: { type: 'spring' as const, stiffness: 500, damping: 22 },
  /** Sztywny — sidebar collapse, layout shifts */
  stiff: { type: 'spring' as const, stiffness: 600, damping: 35 },
} as const

// ── Easings ──────────────────────────────────────────────────

export const ease = {
  default: [0.25, 0.46, 0.45, 0.94] as const,
  in: [0.4, 0, 1, 1] as const,
  out: [0, 0, 0.2, 1] as const,
  smooth: [0.4, 0, 0.2, 1] as const,
  bounce: [0.34, 1.56, 0.64, 1] as const,
} as const

// ── Durations (sekundy) ──────────────────────────────────────

export const duration = {
  instant: 0.08,
  fast: 0.15,
  normal: 0.25,
  medium: 0.35,
  slow: 0.5,
} as const

// ── Stagger ──────────────────────────────────────────────────

export const stagger = {
  /** Karty w gridzie */
  cards: 0.06,
  /** Elementy listy */
  list: 0.04,
  /** Stat cards na dashboardzie */
  stats: 0.08,
} as const

// ═══════════════════════════════════════════════════════════════
// GOTOWE VARIANTS — import i użyj bezpośrednio w komponentach
// ═══════════════════════════════════════════════════════════════

// ── 1. Page Transition ───────────────────────────────────────

export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: duration.fast, ease: ease.in },
  },
} as const

// ── 2. Staggered List ────────────────────────────────────────

export const listContainerVariants = {
  initial: {},
  animate: {
    transition: { staggerChildren: stagger.list, delayChildren: 0.1 },
  },
} as const

export const listItemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: duration.fast },
  },
} as const

// ── 3. StatCard ──────────────────────────────────────────────

export const statCardVariants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay, duration: duration.medium, ease: ease.out },
  }),
  hover: {
    y: -2,
    transition: { duration: duration.fast },
  },
  tap: { scale: 0.98, transition: { duration: duration.instant } },
} as const

// ── 4. Card (generic) ───────────────────────────────────────

export const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
  hover: {
    y: -2,
    transition: { duration: duration.fast },
  },
  tap: { scale: 0.99, transition: { duration: duration.instant } },
} as const

// ── 5. Modal ─────────────────────────────────────────────────

export const modalOverlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: duration.fast } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
} as const

export const modalContentVariants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: spring.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: duration.fast, ease: ease.in },
  },
} as const

// ── 6. Drawer (Vaul) ────────────────────────────────────────

export const drawerVariants = {
  initial: { y: '100%' },
  animate: { y: 0, transition: spring.gentle },
  exit: { y: '100%', transition: { duration: duration.normal, ease: ease.in } },
} as const

// ── 7. Sidebar Nav Item ──────────────────────────────────────

export const navItemVariants = {
  idle: { scale: 1 },
  hover: { scale: 1, transition: { duration: duration.fast } },
  tap: { scale: 0.98, transition: { duration: duration.instant } },
} as const

// ── 8. StatusBadge ───────────────────────────────────────────

export const badgeVariants = {
  initial: { opacity: 0, scale: 0.85 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: spring.bouncy,
  },
} as const

// ── 9. Table Row ─────────────────────────────────────────────

export const tableRowVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: duration.fast },
  },
  exit: {
    opacity: 0,
    transition: { duration: duration.fast },
  },
} as const

// ── 10. Toast (Sonner custom) ────────────────────────────────

export const toastVariants = {
  initial: { opacity: 0, y: 16, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: spring.snappy,
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.96,
    transition: { duration: duration.fast },
  },
} as const

// ── 11. Fade (simple) ───────────────────────────────────────

export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: duration.normal } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
} as const

// ── 12. Slide (directional) ─────────────────────────────────

export const slideVariants = {
  fromRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: duration.normal, ease: ease.out } },
    exit: { opacity: 0, x: -20, transition: { duration: duration.fast } },
  },
  fromLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: { duration: duration.normal, ease: ease.out } },
    exit: { opacity: 0, x: 20, transition: { duration: duration.fast } },
  },
  fromTop: {
    initial: { opacity: 0, y: -12 },
    animate: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: ease.out } },
    exit: { opacity: 0, y: -12, transition: { duration: duration.fast } },
  },
  fromBottom: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: ease.out } },
    exit: { opacity: 0, y: 12, transition: { duration: duration.fast } },
  },
} as const

// ── 13. Collapse/Expand ─────────────────────────────────────

export const collapseVariants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: { height: { duration: duration.normal }, opacity: { duration: duration.fast, delay: 0.05 } },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { height: { duration: duration.normal }, opacity: { duration: duration.fast } },
  },
} as const

// ── 14. Error Shake ─────────────────────────────────────────

export const shakeVariants = {
  idle: { x: 0 },
  shake: {
    x: [0, -8, 8, -4, 4, 0],
    transition: { duration: 0.4 },
  },
} as const

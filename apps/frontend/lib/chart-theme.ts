/**
 * Chart Theme — Centralized Recharts styling constants.
 *
 * Use these when adding Recharts visualizations to ensure
 * consistent look across all charts in the application.
 */

/** Color palette for chart series — matches design system */
export const chartColors = {
  primary: 'hsl(239, 84%, 59%)',   // Indigo — primary
  secondary: 'hsl(160, 84%, 39%)', // Emerald — success
  tertiary: 'hsl(38, 92%, 50%)',   // Amber — warning
  quaternary: 'hsl(280, 65%, 60%)',// Purple — accent
  quinary: 'hsl(340, 75%, 55%)',   // Rose — danger
} as const

/** Gradient definitions for area/bar fills */
export const chartGradients = {
  primary: { start: 'hsl(239, 84%, 59%)', end: 'hsl(239, 84%, 59% / 0.1)' },
  secondary: { start: 'hsl(160, 84%, 39%)', end: 'hsl(160, 84%, 39% / 0.1)' },
  tertiary: { start: 'hsl(38, 92%, 50%)', end: 'hsl(38, 92%, 50% / 0.1)' },
} as const

/** Common chart styling tokens */
export const chartStyle = {
  gridStroke: 'hsl(0, 0%, 90%)',
  gridStrokeDark: 'hsl(0, 0%, 20%)',
  gridStrokeDasharray: '3 3',
  gridOpacity: 0.3,
  axisTickFontSize: 12,
  axisTickFill: 'hsl(0, 0%, 45%)',
  axisTickFillDark: 'hsl(0, 0%, 65%)',
  tooltipBg: 'hsl(0, 0%, 100%)',
  tooltipBgDark: 'hsl(0, 0%, 15%)',
  tooltipBorder: 'hsl(0, 0%, 90%)',
  tooltipBorderDark: 'hsl(0, 0%, 25%)',
  tooltipRadius: 12,
  barRadius: [6, 6, 0, 0] as [number, number, number, number],
  animationDuration: 800,
  animationEasing: 'ease-out' as const,
} as const

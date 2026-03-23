import React from 'react'

// ═══ STEP ANIMATION VARIANTS ═══

export const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
}

// ═══ HELPER: Select all text on focus for number inputs ═══

export const selectAllOnFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.select()
}

// ═══ HELPER: Convert local date+time strings to ISO with timezone offset ═══
// Fixes UTC+1 (Warsaw) shift: without offset, backend stores 14:00Z instead of 13:00Z,
// causing the UI to display times 1 hour later than entered.

export function toLocalISO(dateStr: string, timeStr: string): string {
  const dt = new Date(`${dateStr}T${timeStr}:00`)
  const offsetMin = -dt.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `${dateStr}T${timeStr}:00${sign}${hh}:${mm}`
}

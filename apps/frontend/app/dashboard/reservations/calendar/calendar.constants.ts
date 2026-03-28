export const DAYS_PL = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']
export const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
]

export const STATUS_CONFIG: Record<string, { label: string; dotClass: string; bgClass: string }> = {
  CONFIRMED: {
    label: 'Potwierdzone',
    dotClass: 'bg-emerald-500',
    bgClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  PENDING: {
    label: 'Oczekujące',
    dotClass: 'bg-amber-500',
    bgClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  RESERVED: {
    label: 'W kolejce',
    dotClass: 'bg-blue-500',
    bgClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  COMPLETED: {
    label: 'Zakończone',
    dotClass: 'bg-neutral-400',
    bgClass: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-300',
  },
  CANCELLED: {
    label: 'Anulowane',
    dotClass: 'bg-red-500',
    bgClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
}

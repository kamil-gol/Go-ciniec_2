import { z } from 'zod'

// ═══ CONSTANTS ═══

export const DEFAULT_EXTRA_HOUR_RATE = 500
export const DEFAULT_STANDARD_HOURS = 6

// ═══ SCHEMA ═══

export const reservationSchema = z.object({
  eventTypeId: z.string().min(1, 'Wybierz typ wydarzenia'),
  customEventType: z.string().optional(),
  birthdayAge: z.coerce.number().optional(),
  anniversaryYear: z.coerce.number().optional(),
  anniversaryOccasion: z.string().optional(),
  hallId: z.string().min(1, 'Wybierz salę'),
  startDate: z.string().min(1, 'Wybierz datę rozpoczęcia'),
  startTime: z.string().min(1, 'Wybierz czas rozpoczęcia'),
  endDate: z.string().min(1, 'Wybierz datę zakończenia'),
  endTime: z.string().min(1, 'Wybierz czas zakończenia'),
  adults: z.coerce.number().min(0, 'Liczba dorosłych musi być >= 0'),
  children: z.coerce.number().min(0, 'Liczba dzieci (4-12) musi być >= 0'),
  toddlers: z.coerce.number().min(0, 'Liczba dzieci (0-3) musi być >= 0'),
  useMenuPackage: z.boolean(),
  menuTemplateId: z.string().optional(),
  menuPackageId: z.string().optional(),
  pricePerAdult: z.coerce.number().min(0).optional(),
  pricePerChild: z.coerce.number().min(0).optional(),
  pricePerToddler: z.coerce.number().min(0).optional(),
  clientId: z.string().min(1, 'Wybierz klienta'),
  confirmationDeadline: z.string().optional(),
  notes: z.string().optional(),

  // Sprint 7 — Discount (optional)
  discountEnabled: z.boolean().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  discountValue: z.coerce.number().min(0).optional(),
  discountReason: z.string().optional(),
}).refine((data) => data.adults + data.children + data.toddlers >= 1, {
  message: 'Łączna liczba gości musi być >= 1',
  path: ['adults'],
}).refine((data) => {
  const start = new Date(`${data.startDate}T${data.startTime}`)
  const end = new Date(`${data.endDate}T${data.endTime}`)
  return end > start
}, {
  message: 'Czas zakończenia musi być po czasie rozpoczęcia',
  path: ['endTime'],
}).refine((data) => {
  if (!data.useMenuPackage || !data.menuPackageId) {
    return data.pricePerAdult && data.pricePerAdult > 0
  }
  return true
}, {
  message: 'Cena za dorosłego jest wymagana gdy nie wybrano pakietu menu',
  path: ['pricePerAdult'],
})

export type ReservationFormData = z.infer<typeof reservationSchema>

export const STEP_FIELDS: Record<number, (keyof ReservationFormData)[]> = {
  0: ['eventTypeId'],
  1: ['hallId', 'startDate', 'startTime', 'endDate', 'endTime'],
  2: ['adults', 'children', 'toddlers'],
  3: ['useMenuPackage', 'menuTemplateId', 'menuPackageId', 'pricePerAdult', 'pricePerChild', 'pricePerToddler'],
  4: ['clientId'],
  5: ['confirmationDeadline', 'notes'],
}

import { useMemo } from 'react'
import type { ReservationFormData } from '../validation'
import { DEFAULT_STANDARD_HOURS, DEFAULT_EXTRA_HOUR_RATE } from '../validation'
import { toLocalISO } from '../utils'
import type { SelectedExtra } from '@/components/service-extras/CreateReservationExtrasSection'
import type { Hall, EventType } from '@/types/hall.types'
import type { Client } from '@/types/client.types'
import type { MenuTemplate, MenuPackage } from '@/types/menu.types'

export interface FormComputedParams {
  watchAll: ReservationFormData
  hallsArray: Hall[]
  eventTypesArray: EventType[]
  menuTemplatesArray: MenuTemplate[]
  menuTemplatesLoading: boolean
  templatePackagesArray: MenuPackage[]
  clientsArray: Client[]
  selectedExtras: SelectedExtra[]
}

export function useFormComputed({
  watchAll,
  hallsArray,
  eventTypesArray,
  menuTemplatesArray,
  menuTemplatesLoading,
  templatePackagesArray,
  clientsArray,
  selectedExtras,
}: FormComputedParams) {
  // ═══ WATCHED VALUES ═══
  const useMenuPackage = watchAll.useMenuPackage
  const menuTemplateId = watchAll.menuTemplateId
  const menuPackageId = watchAll.menuPackageId
  const selectedEventTypeId = watchAll.eventTypeId
  const hallId = watchAll.hallId
  const adults = Number(watchAll.adults) || 0
  const children = Number(watchAll.children) || 0
  const toddlers = Number(watchAll.toddlers) || 0
  const pricePerAdult = Number(watchAll.pricePerAdult) || 0
  const pricePerChild = Number(watchAll.pricePerChild) || 0
  const pricePerToddler = Number(watchAll.pricePerToddler) || 0
  const startDate = watchAll.startDate
  const startTime = watchAll.startTime
  const endDate = watchAll.endDate
  const endTime = watchAll.endTime
  const discountEnabled = !!watchAll.discountEnabled
  const discountType = (watchAll.discountType || 'PERCENTAGE') as 'PERCENTAGE' | 'FIXED'
  const discountValue = Number(watchAll.discountValue) || 0
  const discountReason = watchAll.discountReason || ''

  // ═══ EVENT TYPE ═══
  const selectedEventType = useMemo(() => {
    if (!selectedEventTypeId) return null
    return eventTypesArray.find((t) => t.id === selectedEventTypeId) || null
  }, [selectedEventTypeId, eventTypesArray])

  const standardHours = Number(selectedEventType?.standardHours) || DEFAULT_STANDARD_HOURS
  const extraHourRate = Number(selectedEventType?.extraHourRate) || DEFAULT_EXTRA_HOUR_RATE

  const selectedEventTypeName = useMemo(() => {
    const t = eventTypesArray.find((t) => t.id === selectedEventTypeId)
    return t?.name || ''
  }, [selectedEventTypeId, eventTypesArray])

  const isBirthday = selectedEventTypeName === 'Urodziny'
  const isAnniversary = selectedEventTypeName === 'Rocznica' || selectedEventTypeName === 'Rocznica/Jubileusz'
  const isCustom = selectedEventTypeName === 'Inne'

  // ═══ HALL ═══
  const selectedHall = useMemo(() => hallsArray.find((h) => h.id === hallId), [hallsArray, hallId])
  const selectedHallCapacity = selectedHall?.capacity || 0
  const isMultiBookingHall = !!selectedHall?.allowMultipleBookings

  // ═══ DATE/TIME ISO ═══
  const startDateTimeISO = useMemo(() => {
    if (startDate && startTime) return toLocalISO(startDate, startTime)
    return undefined
  }, [startDate, startTime])

  const endDateTimeISO = useMemo(() => {
    if (endDate && endTime) return toLocalISO(endDate, endTime)
    return undefined
  }, [endDate, endTime])

  // ═══ MENU ═══
  const selectedTemplate = useMemo(() => {
    if (!menuTemplateId) return null
    return menuTemplatesArray.find((t) => t.id === menuTemplateId) || null
  }, [menuTemplateId, menuTemplatesArray])

  const selectedPackage = useMemo(() => {
    if (!menuPackageId) return null
    return templatePackagesArray.find((pkg) => pkg.id === menuPackageId) || null
  }, [menuPackageId, templatePackagesArray])

  const hasNoTemplatesForEventType = selectedEventTypeId && !menuTemplatesLoading && menuTemplatesArray.length === 0

  // ═══ GUESTS ═══
  const totalGuests = adults + children + toddlers
  const calculatedPrice = (adults * pricePerAdult) + (children * pricePerChild) + (toddlers * pricePerToddler)

  // ═══ DURATION ═══
  const durationHours = useMemo(() => {
    if (startDate && startTime && endDate && endTime) {
      const start = new Date(`${startDate}T${startTime}`)
      const end = new Date(`${endDate}T${endTime}`)
      const diffMs = end.getTime() - start.getTime()
      return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10
    }
    return 0
  }, [startDate, startTime, endDate, endTime])

  const extraHours = useMemo(() => {
    if (durationHours > standardHours) return Math.ceil(durationHours - standardHours)
    return 0
  }, [durationHours, standardHours])

  const extraHoursCost = extraHours * extraHourRate

  // ═══ EXTRAS ═══
  const extrasTotal = useMemo(() => {
    let total = 0
    for (const extra of selectedExtras) {
      const item = extra.serviceItem
      if (item.priceType === 'FREE') continue
      if (item.priceType === 'PER_PERSON') {
        total += item.basePrice * totalGuests * extra.quantity
      } else {
        total += item.basePrice * extra.quantity
      }
    }
    return total
  }, [selectedExtras, totalGuests])

  // ═══ VENUE SURCHARGE ═══
  const venueSurcharge = useMemo(() => {
    if (!selectedHall || !selectedHall.isWholeVenue) {
      return { amount: 0, label: null as string | null }
    }
    if (totalGuests < 30) {
      return { amount: 3000, label: 'Dopłata za cały obiekt (poniżej 30 gości)' }
    }
    return { amount: 2000, label: 'Dopłata za cały obiekt (30+ gości)' }
  }, [selectedHall, totalGuests])
  const venueSurchargeAmount = venueSurcharge.amount

  const totalWithExtras = calculatedPrice + extraHoursCost + extrasTotal + venueSurchargeAmount

  // ═══ DISCOUNT ═══
  const discountAmount = useMemo(() => {
    if (!discountEnabled || discountValue <= 0 || totalWithExtras <= 0) return 0
    if (discountType === 'PERCENTAGE') {
      return Math.round((totalWithExtras * discountValue) / 100)
    }
    return Math.min(discountValue, totalWithExtras)
  }, [discountEnabled, discountType, discountValue, totalWithExtras])

  const finalTotalPrice = Math.max(0, totalWithExtras - discountAmount)
  const isDiscountValid = discountEnabled && discountAmount > 0 && discountReason.trim().length >= 3

  // ═══ CLIENTS ═══
  const clientComboboxOptions = useMemo(() =>
    clientsArray.map((client) => {
      const isCompany = client.clientType === 'COMPANY'
      const companyName = client.companyName
      const nip = client.nip

      if (isCompany && companyName) {
        return {
          value: client.id,
          label: `🏢 ${companyName} · ${client.firstName} ${client.lastName}`,
          description: nip ? `NIP: ${nip}` : client.email || undefined,
          secondaryLabel: client.phone || undefined,
        }
      }
      return {
        value: client.id,
        label: `${client.firstName} ${client.lastName}`,
        description: client.email || undefined,
        secondaryLabel: client.phone || undefined,
      }
    }),
  [clientsArray])

  const selectedClient = useMemo(() =>
    clientsArray.find((c) => c.id === watchAll.clientId),
  [clientsArray, watchAll.clientId])

  return {
    // Watched values
    useMenuPackage,
    menuTemplateId,
    menuPackageId,
    selectedEventTypeId,
    hallId,
    adults,
    children,
    toddlers,
    pricePerAdult,
    pricePerChild,
    pricePerToddler,
    startDate,
    startTime,
    endDate,
    endTime,
    discountEnabled,
    discountType,
    discountValue,
    discountReason,

    // Event type
    selectedEventType,
    standardHours,
    extraHourRate,
    selectedEventTypeName,
    isBirthday,
    isAnniversary,
    isCustom,

    // Hall
    selectedHall,
    selectedHallCapacity,
    isMultiBookingHall,

    // Date/time ISO
    startDateTimeISO,
    endDateTimeISO,

    // Menu
    selectedTemplate,
    selectedPackage,
    hasNoTemplatesForEventType,

    // Guests & pricing
    totalGuests,
    calculatedPrice,
    durationHours,
    extraHours,
    extraHoursCost,
    extrasTotal,
    venueSurcharge,
    venueSurchargeAmount,
    totalWithExtras,
    discountAmount,
    finalTotalPrice,
    isDiscountValid,

    // Clients
    clientComboboxOptions,
    selectedClient,
  }
}

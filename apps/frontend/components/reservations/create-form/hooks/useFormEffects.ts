import { useEffect } from 'react'
import type { UseFormSetValue, UseFormWatch } from 'react-hook-form'
import type { ReservationFormData } from '../validation'
import type { Hall } from '@/types/hall.types'
import type { MenuTemplate, MenuPackage } from '@/types/menu.types'

export interface FormEffectsParams {
  watch: UseFormWatch<ReservationFormData>
  setValue: UseFormSetValue<ReservationFormData>

  // Default hall from props
  defaultHallId: string | undefined
  hallsArray: Hall[]

  // Computed values
  standardHours: number
  useMenuPackage: boolean
  selectedPackage: MenuPackage | null
  pricePerAdult: number
  selectedEventTypeId: string | undefined
  menuTemplateId: string | undefined
  menuPackageId: string | undefined
  menuTemplatesArray: MenuTemplate[]
  templatePackagesArray: MenuPackage[]
  hallId: string | undefined

  // Manual price flags
  childPriceManuallySet: boolean
  setChildPriceManuallySet: (v: boolean) => void
  toddlerPriceManuallySet: boolean
  setToddlerPriceManuallySet: (v: boolean) => void
}

export function useFormEffects({
  watch,
  setValue,
  defaultHallId,
  hallsArray,
  standardHours,
  useMenuPackage,
  selectedPackage,
  pricePerAdult,
  selectedEventTypeId,
  menuTemplateId,
  menuPackageId,
  menuTemplatesArray,
  templatePackagesArray,
  hallId,
  childPriceManuallySet,
  setChildPriceManuallySet,
  toddlerPriceManuallySet,
  setToddlerPriceManuallySet,
}: FormEffectsParams) {
  const watchAll = watch()
  const startDate = watch('startDate')
  const startTime = watch('startTime')

  // Auto-set default hall
  useEffect(() => {
    if (defaultHallId && hallsArray.length > 0 && !watchAll.hallId) {
      const hallExists = hallsArray.some((h) => h.id === defaultHallId)
      if (hallExists) setValue('hallId', defaultHallId)
    }
  }, [defaultHallId, hallsArray, setValue, watchAll.hallId])

  // Auto-fill end time from start
  useEffect(() => {
    if (startDate && startTime && !watchAll.endDate && !watchAll.endTime) {
      const start = new Date(`${startDate}T${startTime}`)
      const end = new Date(start.getTime() + standardHours * 60 * 60 * 1000)
      setValue('endDate', `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`)
      setValue('endTime', end.toTimeString().slice(0, 5))
    }
  }, [startDate, startTime, watchAll.endDate, watchAll.endTime, setValue, standardHours])

  // Set prices from selected package
  useEffect(() => {
    if (useMenuPackage && selectedPackage) {
      setValue('pricePerAdult', Number(selectedPackage.pricePerAdult) || 0)
      setValue('pricePerChild', Number(selectedPackage.pricePerChild) || 0)
      setValue('pricePerToddler', Number(selectedPackage.pricePerToddler) || 0)
    }
  }, [useMenuPackage, selectedPackage, setValue])

  // Reset manual price flags when switching to package mode
  useEffect(() => {
    if (useMenuPackage) {
      setChildPriceManuallySet(false)
      setToddlerPriceManuallySet(false)
    }
  }, [useMenuPackage, setChildPriceManuallySet, setToddlerPriceManuallySet])

  // Clear template + package when event type changes
  useEffect(() => {
    if (selectedEventTypeId) {
      if (menuTemplateId && menuTemplatesArray.length > 0) {
        const isValid = menuTemplatesArray.some((t) => t.id === menuTemplateId)
        if (!isValid) {
          setValue('menuTemplateId', '')
          setValue('menuPackageId', '')
        }
      }
    }
  }, [selectedEventTypeId, menuTemplateId, menuTemplatesArray, setValue])

  // Clear package when template changes
  useEffect(() => {
    if (menuTemplateId && templatePackagesArray.length > 0 && menuPackageId) {
      const isValid = templatePackagesArray.some((pkg) => pkg.id === menuPackageId)
      if (!isValid) {
        setValue('menuPackageId', '')
      }
    }
  }, [menuTemplateId, menuPackageId, templatePackagesArray, setValue])

  // Auto-derive child price from adult price
  useEffect(() => {
    if (!useMenuPackage && pricePerAdult > 0 && !childPriceManuallySet) {
      setValue('pricePerChild', Math.round(pricePerAdult / 2))
    }
  }, [useMenuPackage, pricePerAdult, setValue, childPriceManuallySet])

  // Auto-derive toddler price from adult price
  useEffect(() => {
    if (!useMenuPackage && pricePerAdult > 0 && !toddlerPriceManuallySet) {
      setValue('pricePerToddler', Math.round(pricePerAdult * 0.25))
    }
  }, [useMenuPackage, pricePerAdult, setValue, toddlerPriceManuallySet])

  // Hall default price
  useEffect(() => {
    if (hallId && !useMenuPackage && !watchAll.pricePerAdult) {
      const hall = hallsArray.find((h) => h.id === hallId)
      if (hall?.pricePerPerson) setValue('pricePerAdult', hall.pricePerPerson)
    }
  }, [hallId, hallsArray, setValue, useMenuPackage, watchAll.pricePerAdult])
}

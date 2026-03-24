import { useMemo } from 'react'
import { useHalls, useAvailableCapacity } from '@/hooks/use-halls'
import { useClients } from '@/hooks/use-clients'
import { useEventTypes } from '@/hooks/use-event-types'
import { useMenuTemplates, usePackagesByTemplate } from '@/hooks/use-menu-config'
import { useCheckAvailability } from '@/hooks/use-check-availability'

export interface FormQueriesParams {
  selectedEventTypeId: string | undefined
  menuTemplateId: string | undefined
  hallId: string | undefined
  startDateTimeISO: string | undefined
  endDateTimeISO: string | undefined
}

export function useFormQueries({
  selectedEventTypeId,
  menuTemplateId,
  hallId,
  startDateTimeISO,
  endDateTimeISO,
}: FormQueriesParams) {
  const { data: halls } = useHalls()
  const { data: clientsData, isLoading: clientsLoading } = useClients()
  const { data: eventTypes } = useEventTypes()

  // Menu templates filtered by event type
  const { data: menuTemplates, isLoading: menuTemplatesLoading } = useMenuTemplates(
    selectedEventTypeId ? { eventTypeId: selectedEventTypeId, isActive: true } : undefined
  )

  // Packages filtered by selected template
  const { data: templatePackages, isLoading: templatePackagesLoading } = usePackagesByTemplate(menuTemplateId)

  const { data: availability, isLoading: availabilityLoading } = useCheckAvailability(
    hallId, startDateTimeISO, endDateTimeISO
  )

  // #165: Available capacity for multi-booking halls
  const { data: availableCapacity, isLoading: capacityLoading } = useAvailableCapacity(
    hallId, startDateTimeISO, endDateTimeISO
  )

  const hallsArray = useMemo(() => Array.isArray(halls?.halls) ? halls.halls : [], [halls])
  const clientsArray = useMemo(() => Array.isArray(clientsData) ? clientsData : [], [clientsData])
  const eventTypesArray = useMemo(() => Array.isArray(eventTypes) ? eventTypes : [], [eventTypes])
  const menuTemplatesArray = useMemo(() => Array.isArray(menuTemplates) ? menuTemplates : [], [menuTemplates])
  const templatePackagesArray = useMemo(() => Array.isArray(templatePackages) ? templatePackages : [], [templatePackages])

  return {
    hallsArray,
    clientsArray,
    clientsLoading,
    eventTypesArray,
    menuTemplatesArray,
    menuTemplatesLoading,
    templatePackagesArray,
    templatePackagesLoading,
    availability,
    availabilityLoading,
    availableCapacity,
    capacityLoading,
  }
}

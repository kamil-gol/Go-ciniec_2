// Barrel file — re-exports from domain-specific type modules
// All existing `import { X } from '@/types'` continue to work.

export * from './common.types'
export * from './hall.types'
export * from './client.types'
export * from './menu.domain.types'
export * from './dish.types'
export * from './reservation.types'
export * from './queue.types'

// Re-export Service Extras types
export type {
  ServicePriceType,
  ExtraStatus,
  ServiceCategory,
  ServiceItem,
  ReservationExtra,
  CreateServiceCategoryInput,
  UpdateServiceCategoryInput,
  CreateServiceItemInput,
  UpdateServiceItemInput,
  AssignExtraInput,
  BulkAssignExtrasInput,
  UpdateReservationExtraInput,
  ServiceExtrasListResponse,
  ReservationExtrasResponse,
} from './service-extra.types'

export {
  PRICE_TYPE_LABELS,
  EXTRA_STATUS_LABELS,
  EXTRA_STATUS_COLORS,
} from './service-extra.types'

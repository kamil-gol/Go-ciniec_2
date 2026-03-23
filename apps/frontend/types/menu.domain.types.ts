// Menu Package types
export interface MenuPackage {
  id: string
  name: string
  description?: string
  menuTemplateId: string
  pricePerAdult: number
  pricePerChild: number
  pricePerToddler: number
  minGuests?: number
  maxGuests?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  menuTemplate?: {
    id: string
    name: string
  }
}

// Menu Option (dodatki do pakietów)
export interface MenuOption {
  id: string
  menuTemplateId: string
  name: string
  description?: string
  pricePerUnit: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Menu Option Selection (wybrane opcje)
export interface MenuOptionSelection {
  optionId: string
  quantity: number
}

// Menu Snapshot (zapis menu w rezerwacji)
export interface MenuSnapshot {
  id: string
  reservationId: string
  menuData: {
    packageName: string
    templateName: string
    pricePerAdult: number
    pricePerChild: number
    pricePerToddler: number
    selectedOptions: Array<{
      name: string
      pricePerUnit: number
      quantity: number
    }>
    packageDescription?: string
  }
  menuTemplateId: string
  packageId: string
  packagePrice: string
  optionsPrice: string
  totalMenuPrice: string
  adultsCount: number
  childrenCount: number
  toddlersCount: number
  selectedAt: string
  updatedAt: string
}

// Menu API Types
export interface UpdateReservationMenuInput {
  packageId: string | null // null to remove menu
  adultsCount?: number // Optional - override guest counts
  childrenCount?: number
  toddlersCount?: number
  selectedOptions?: MenuOptionSelection[]
}

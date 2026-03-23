// Hall types
export interface Hall {
  id: string
  name: string
  capacity: number
  pricePerPerson: number
  pricePerChild?: number // New field - optional price per child
  description?: string
  isActive: boolean
  isWholeVenue: boolean // Whether this hall represents the entire venue
  createdAt: string
  updatedAt: string
}

// Event Type
export interface EventType {
  id: string
  name: string
  standardHours?: number   // Extra-hours feature: hours included in base price
  extraHourRate?: number   // Extra-hours feature: PLN per extra hour (0 = no surcharge)
  createdAt: string
}

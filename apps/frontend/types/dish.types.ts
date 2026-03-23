// Dish Category types
export interface DishCategory {
  id: string
  slug: string
  name: string
  icon: string | null
  color: string | null
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    dishes: number
  }
}

// Dish types
export interface Dish {
  id: string
  categoryId: string
  category: DishCategory
  name: string
  description: string | null
  allergens: string[]
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreateDishInput {
  name: string
  description?: string | null
  categoryId: string
  allergens?: string[]
  isActive?: boolean
}

export interface UpdateDishInput extends Partial<CreateDishInput> {}

export interface CreateDishCategoryInput {
  slug: string
  name: string
  icon?: string | null
  color?: string | null
  displayOrder?: number
  isActive?: boolean
}

export interface UpdateDishCategoryInput extends Partial<CreateDishCategoryInput> {}

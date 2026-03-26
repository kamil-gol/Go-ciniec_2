/**
 * useMenuConfig Hook Tests
 *
 * Testy konfiguracji menu:
 * - Szablony menu (CRUD + duplikacja)
 * - Pakiety (CRUD + reorder + assign options)
 * - Kategorie dań (CRUD)
 * - Dania i dania w kursach (CRUD)
 * - Kursy menu
 * - Klucze query
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// ── Hoisted mocks ──

const { mockTemplatesApi, mockPackagesApi, mockDishCategoriesApi, mockDishesApi, mockCoursesApi } = vi.hoisted(() => ({
  mockTemplatesApi: {
    getMenuTemplates: vi.fn(),
    getMenuTemplateById: vi.fn(),
    getActiveMenuTemplate: vi.fn(),
    createMenuTemplate: vi.fn(),
    updateMenuTemplate: vi.fn(),
    deleteMenuTemplate: vi.fn(),
    duplicateMenuTemplate: vi.fn(),
  },
  mockPackagesApi: {
    getAllActivePackages: vi.fn(),
    getPackagesByEventType: vi.fn(),
    getPackagesByTemplate: vi.fn(),
    getPackageById: vi.fn(),
    createPackage: vi.fn(),
    updatePackage: vi.fn(),
    deletePackage: vi.fn(),
    reorderPackages: vi.fn(),
    assignOptionsToPackage: vi.fn(),
  },
  mockDishCategoriesApi: {
    getCategories: vi.fn(),
    getCategory: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
  mockDishesApi: {
    getDishes: vi.fn(),
    getDish: vi.fn(),
    createDish: vi.fn(),
    updateDish: vi.fn(),
    deleteDish: vi.fn(),
  },
  mockCoursesApi: {
    getCoursesByPackage: vi.fn(),
    getCourse: vi.fn(),
    createCourse: vi.fn(),
    updateCourse: vi.fn(),
    deleteCourse: vi.fn(),
    assignDishes: vi.fn(),
    removeDish: vi.fn(),
  },
}))

vi.mock('@/lib/api/menu-templates-api', () => ({
  getMenuTemplates: (...a: any[]) => mockTemplatesApi.getMenuTemplates(...a),
  getMenuTemplateById: (...a: any[]) => mockTemplatesApi.getMenuTemplateById(...a),
  getActiveMenuTemplate: (...a: any[]) => mockTemplatesApi.getActiveMenuTemplate(...a),
  createMenuTemplate: (...a: any[]) => mockTemplatesApi.createMenuTemplate(...a),
  updateMenuTemplate: (...a: any[]) => mockTemplatesApi.updateMenuTemplate(...a),
  deleteMenuTemplate: (...a: any[]) => mockTemplatesApi.deleteMenuTemplate(...a),
  duplicateMenuTemplate: (...a: any[]) => mockTemplatesApi.duplicateMenuTemplate(...a),
}))

vi.mock('@/lib/api/menu-packages-api', () => ({
  getAllActivePackages: (...a: any[]) => mockPackagesApi.getAllActivePackages(...a),
  getPackagesByEventType: (...a: any[]) => mockPackagesApi.getPackagesByEventType(...a),
  getPackagesByTemplate: (...a: any[]) => mockPackagesApi.getPackagesByTemplate(...a),
  getPackageById: (...a: any[]) => mockPackagesApi.getPackageById(...a),
  createPackage: (...a: any[]) => mockPackagesApi.createPackage(...a),
  updatePackage: (...a: any[]) => mockPackagesApi.updatePackage(...a),
  deletePackage: (...a: any[]) => mockPackagesApi.deletePackage(...a),
  reorderPackages: (...a: any[]) => mockPackagesApi.reorderPackages(...a),
  assignOptionsToPackage: (...a: any[]) => mockPackagesApi.assignOptionsToPackage(...a),
}))

vi.mock('@/lib/api/dish-categories-api', () => ({
  dishCategoriesApi: mockDishCategoriesApi,
}))

vi.mock('@/lib/api/dishes-api', () => ({
  dishesApi: mockDishesApi,
}))

vi.mock('@/lib/api/menu-courses-api', () => ({
  menuCoursesApi: mockCoursesApi,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import {
  dishCategoriesKeys,
  dishCoursesKeys,
  useMenuTemplates,
  useMenuTemplate,
  useActiveMenuTemplate,
  useCreateMenuTemplate,
  useUpdateMenuTemplate,
  useDeleteMenuTemplate,
  useDuplicateMenuTemplate,
  useAllActivePackages,
  usePackagesByEventType,
  usePackagesByTemplate,
  usePackage,
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage,
  useReorderPackages,
  useAssignOptions,
  useDishCategories,
  useDishCategory,
  useCreateDishCategory,
  useUpdateDishCategory,
  useDeleteDishCategory,
  useDishes,
  useDish,
  useCreateDish,
  useUpdateDish,
  useDeleteDish,
  useMenuCourses,
  useMenuCourse,
  useCreateMenuCourse,
  useUpdateMenuCourse,
  useDeleteMenuCourse,
  useAssignDishes,
  useRemoveDish,
} from '@/hooks/use-menu-config'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

// ═══ Query Keys ═══

describe('dishCategoriesKeys', () => {
  it('generates correct hierarchy', () => {
    expect(dishCategoriesKeys.all).toEqual(['dish-categories'])
    expect(dishCategoriesKeys.lists()).toEqual(['dish-categories', 'list'])
    expect(dishCategoriesKeys.detail('c1')).toEqual(['dish-categories', 'detail', 'c1'])
  })
})

describe('dishCoursesKeys', () => {
  it('generates correct hierarchy', () => {
    expect(dishCoursesKeys.all).toEqual(['dishes-courses'])
    expect(dishCoursesKeys.dishes()).toEqual(['dishes-courses', 'dishes'])
    expect(dishCoursesKeys.dish('d1')).toEqual(['dishes-courses', 'dishes', 'd1'])
    expect(dishCoursesKeys.courses()).toEqual(['dishes-courses', 'courses'])
    expect(dishCoursesKeys.coursesByPackage('p1')).toEqual(['dishes-courses', 'courses', 'package', 'p1'])
    expect(dishCoursesKeys.course('co1')).toEqual(['dishes-courses', 'courses', 'co1'])
  })
})

// ═══ Templates ═══

describe('useMenuTemplates', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches templates', async () => {
    mockTemplatesApi.getMenuTemplates.mockResolvedValue([{ id: 't1' }])
    const { result } = renderHook(() => useMenuTemplates(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 't1' }])
  })
})

describe('useMenuTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('is disabled for undefined id', () => {
    const { result } = renderHook(() => useMenuTemplate(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('fetches template by id', async () => {
    mockTemplatesApi.getMenuTemplateById.mockResolvedValue({ id: 't1', name: 'Menu A' })
    const { result } = renderHook(() => useMenuTemplate('t1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useActiveMenuTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('is disabled for undefined eventTypeId', () => {
    const { result } = renderHook(() => useActiveMenuTemplate(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreateMenuTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates template', async () => {
    mockTemplatesApi.createMenuTemplate.mockResolvedValue({ id: 'new' })
    const { result } = renderHook(() => useCreateMenuTemplate(), { wrapper: createWrapper() })
    result.current.mutate({ name: 'Nowy' } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useDeleteMenuTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes template', async () => {
    mockTemplatesApi.deleteMenuTemplate.mockResolvedValue(undefined)
    const { result } = renderHook(() => useDeleteMenuTemplate(), { wrapper: createWrapper() })
    result.current.mutate('t1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockTemplatesApi.deleteMenuTemplate).toHaveBeenCalledWith('t1')
  })
})

describe('useDuplicateMenuTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('duplicates template', async () => {
    mockTemplatesApi.duplicateMenuTemplate.mockResolvedValue({ id: 'dup' })
    const { result } = renderHook(() => useDuplicateMenuTemplate(), { wrapper: createWrapper() })
    result.current.mutate({ id: 't1', input: { name: 'Kopia' } as any })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockTemplatesApi.duplicateMenuTemplate).toHaveBeenCalledWith('t1', { name: 'Kopia' })
  })
})

// ═══ Packages ═══

describe('useAllActivePackages', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches active packages', async () => {
    mockPackagesApi.getAllActivePackages.mockResolvedValue([{ id: 'p1' }])
    const { result } = renderHook(() => useAllActivePackages(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('usePackagesByEventType', () => {
  beforeEach(() => vi.clearAllMocks())

  it('is disabled for undefined eventTypeId', () => {
    const { result } = renderHook(() => usePackagesByEventType(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('usePackagesByTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('is disabled for undefined templateId', () => {
    const { result } = renderHook(() => usePackagesByTemplate(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreatePackage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates package', async () => {
    mockPackagesApi.createPackage.mockResolvedValue({ id: 'new' })
    const { result } = renderHook(() => useCreatePackage(), { wrapper: createWrapper() })
    result.current.mutate({ name: 'Gold' } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useDeletePackage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes package', async () => {
    mockPackagesApi.deletePackage.mockResolvedValue(undefined)
    const { result } = renderHook(() => useDeletePackage(), { wrapper: createWrapper() })
    result.current.mutate('p1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockPackagesApi.deletePackage).toHaveBeenCalledWith('p1')
  })
})

describe('useReorderPackages', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reorders packages', async () => {
    mockPackagesApi.reorderPackages.mockResolvedValue([])
    const { result } = renderHook(() => useReorderPackages(), { wrapper: createWrapper() })
    result.current.mutate({ templateId: 't1', orderedIds: ['p2', 'p1'] } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useAssignOptions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('assigns options to package', async () => {
    mockPackagesApi.assignOptionsToPackage.mockResolvedValue({})
    const { result } = renderHook(() => useAssignOptions(), { wrapper: createWrapper() })
    result.current.mutate({ packageId: 'p1', input: { optionIds: ['o1'] } as any })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockPackagesApi.assignOptionsToPackage).toHaveBeenCalledWith('p1', { optionIds: ['o1'] })
  })
})

// ═══ Dish Categories ═══

describe('useDishCategories (menu-config)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches categories', async () => {
    mockDishCategoriesApi.getCategories.mockResolvedValue({ data: [{ id: 'c1' }] })
    const { result } = renderHook(() => useDishCategories(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 'c1' }])
  })
})

describe('useCreateDishCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates category', async () => {
    mockDishCategoriesApi.createCategory.mockResolvedValue({ data: { id: 'new' } })
    const { result } = renderHook(() => useCreateDishCategory(), { wrapper: createWrapper() })
    result.current.mutate({ name: 'Zupy' } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useDeleteDishCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes category', async () => {
    mockDishCategoriesApi.deleteCategory.mockResolvedValue({})
    const { result } = renderHook(() => useDeleteDishCategory(), { wrapper: createWrapper() })
    result.current.mutate('c1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockDishCategoriesApi.deleteCategory).toHaveBeenCalledWith('c1')
  })
})

// ═══ Dishes (in menu-config) ═══

describe('useDishes (menu-config)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches dishes', async () => {
    mockDishesApi.getDishes.mockResolvedValue({ data: [{ id: 'd1' }] })
    const { result } = renderHook(() => useDishes(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 'd1' }])
  })
})

describe('useCreateDish (menu-config)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates dish', async () => {
    mockDishesApi.createDish.mockResolvedValue({ data: { id: 'new' } })
    const { result } = renderHook(() => useCreateDish(), { wrapper: createWrapper() })
    result.current.mutate({ name: 'Bigos' } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

// ═══ Menu Courses ═══

describe('useMenuCourses', () => {
  beforeEach(() => vi.clearAllMocks())

  it('is disabled for undefined packageId', () => {
    const { result } = renderHook(() => useMenuCourses(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('fetches courses by package', async () => {
    mockCoursesApi.getCoursesByPackage.mockResolvedValue({ data: [{ id: 'co1' }] })
    const { result } = renderHook(() => useMenuCourses('p1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 'co1' }])
  })
})

describe('useCreateMenuCourse', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates course', async () => {
    mockCoursesApi.createCourse.mockResolvedValue({ data: { id: 'co-new', packageId: 'p1' } })
    const { result } = renderHook(() => useCreateMenuCourse(), { wrapper: createWrapper() })
    result.current.mutate({ name: 'Przystawki', packageId: 'p1' } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useDeleteMenuCourse', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes course', async () => {
    mockCoursesApi.deleteCourse.mockResolvedValue({})
    const { result } = renderHook(() => useDeleteMenuCourse(), { wrapper: createWrapper() })
    result.current.mutate({ id: 'co1', packageId: 'p1' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockCoursesApi.deleteCourse).toHaveBeenCalledWith('co1')
  })
})

describe('useAssignDishes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('assigns dishes to course', async () => {
    mockCoursesApi.assignDishes.mockResolvedValue({ data: { id: 'co1', packageId: 'p1' } })
    const { result } = renderHook(() => useAssignDishes(), { wrapper: createWrapper() })
    result.current.mutate({ courseId: 'co1', input: { dishIds: ['d1'] } as any })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockCoursesApi.assignDishes).toHaveBeenCalledWith('co1', { dishIds: ['d1'] })
  })
})

describe('useRemoveDish', () => {
  beforeEach(() => vi.clearAllMocks())

  it('removes dish from course', async () => {
    mockCoursesApi.removeDish.mockResolvedValue({})
    const { result } = renderHook(() => useRemoveDish(), { wrapper: createWrapper() })
    result.current.mutate({ courseId: 'co1', dishId: 'd1', packageId: 'p1' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockCoursesApi.removeDish).toHaveBeenCalledWith('co1', 'd1')
  })
})

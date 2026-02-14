/**
 * Menu Routes
 * 
 * Express router for all menu-related endpoints
 * Auth: GET = requireStaff, POST/PUT/DELETE = requireAdmin
 */

import { Router } from 'express';
import { menuTemplateController } from '../controllers/menuTemplate.controller';
import { menuPackageController } from '../controllers/menuPackage.controller';
import { menuOptionController } from '../controllers/menuOption.controller';
import { reservationMenuController } from '../controllers/reservationMenu.controller';
import { menuCourseController } from '../controllers/menuCourse.controller';
import { packageCategoryController } from '../controllers/packageCategory.controller';
import { addonGroupController } from '../controllers/addonGroup.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin, requireStaff } from '../middlewares/roles';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// MENU TEMPLATES
// ═══════════════════════════════════════════════════════════════

/**
 * @route   GET /api/menu-templates
 * @desc    List all menu templates (with optional filters)
 * @query   eventTypeId?: string, isActive?: boolean, date?: string
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/menu-templates',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res) => {
    await menuTemplateController.list.call(menuTemplateController, req, res);
  })
);

/**
 * @route   GET /api/menu-templates/active/:eventTypeId
 * @desc    Get active menu template for event type on specific date
 * @params  eventTypeId: string
 * @query   date?: string (defaults to today)
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/menu-templates/active/:eventTypeId',
  authMiddleware,
  requireStaff,
  validateUUID('eventTypeId'),
  asyncHandler(async (req, res) => {
    await menuTemplateController.getActive.call(menuTemplateController, req, res);
  })
);

/**
 * @route   GET /api/menu-templates/:id
 * @desc    Get single menu template by ID
 * @params  id: string
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/menu-templates/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await menuTemplateController.getById.call(menuTemplateController, req, res);
  })
);

/**
 * @route   POST /api/menu-templates
 * @desc    Create new menu template
 * @body    CreateMenuTemplateInput
 * @access  Admin only
 */
router.post(
  '/menu-templates',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await menuTemplateController.create.call(menuTemplateController, req, res);
  })
);

/**
 * @route   PUT /api/menu-templates/:id
 * @desc    Update menu template
 * @params  id: string
 * @body    UpdateMenuTemplateInput
 * @access  Admin only
 */
router.put(
  '/menu-templates/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await menuTemplateController.update.call(menuTemplateController, req, res);
  })
);

/**
 * @route   DELETE /api/menu-templates/:id
 * @desc    Delete menu template
 * @params  id: string
 * @access  Admin only
 */
router.delete(
  '/menu-templates/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await menuTemplateController.delete.call(menuTemplateController, req, res);
  })
);

/**
 * @route   POST /api/menu-templates/:id/duplicate
 * @desc    Duplicate menu template with all packages and options
 * @params  id: string
 * @body    DuplicateMenuTemplateInput
 * @access  Admin only
 */
router.post(
  '/menu-templates/:id/duplicate',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await menuTemplateController.duplicate.call(menuTemplateController, req, res);
  })
);

// ═══════════════════════════════════════════════════════════════
// MENU PACKAGES
// ═══════════════════════════════════════════════════════════════

/**
 * @route   GET /api/menu-packages
 * @desc    List all packages (with optional filter)
 * @query   menuTemplateId?: string
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/menu-packages',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res) => {
    await menuPackageController.list.call(menuPackageController, req, res);
  })
);

/**
 * @route   GET /api/menu-packages/event-type/:eventTypeId
 * @desc    List all active packages for a specific event type
 * @params  eventTypeId: string
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/menu-packages/event-type/:eventTypeId',
  authMiddleware,
  requireStaff,
  validateUUID('eventTypeId'),
  asyncHandler(async (req, res) => {
    await menuPackageController.listByEventType.call(menuPackageController, req, res);
  })
);

/**
 * @route   GET /api/menu-packages/template/:templateId
 * @desc    List all packages for a menu template
 * @params  templateId: string
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/menu-packages/template/:templateId',
  authMiddleware,
  requireStaff,
  validateUUID('templateId'),
  asyncHandler(async (req, res) => {
    await menuPackageController.listByTemplate.call(menuPackageController, req, res);
  })
);

/**
 * @route   PUT /api/menu-packages/reorder
 * @desc    Reorder packages (drag & drop)
 * @body    ReorderPackagesInput
 * @access  Admin only
 * @note    MUST be defined BEFORE /menu-packages/:id to avoid route conflict
 */
router.put(
  '/menu-packages/reorder',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await menuPackageController.reorder.call(menuPackageController, req, res);
  })
);

/**
 * @route   GET /api/menu-packages/:id
 * @desc    Get single package by ID
 * @params  id: string
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/menu-packages/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await menuPackageController.getById.call(menuPackageController, req, res);
  })
);

/**
 * @route   POST /api/menu-packages
 * @desc    Create new package
 * @body    CreateMenuPackageInput
 * @access  Admin only
 */
router.post(
  '/menu-packages',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await menuPackageController.create.call(menuPackageController, req, res);
  })
);

/**
 * @route   PUT /api/menu-packages/:id
 * @desc    Update package
 * @params  id: string
 * @body    UpdateMenuPackageInput
 * @access  Admin only
 */
router.put(
  '/menu-packages/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await menuPackageController.update.call(menuPackageController, req, res);
  })
);

/**
 * @route   DELETE /api/menu-packages/:id
 * @desc    Delete package
 * @params  id: string
 * @access  Admin only
 */
router.delete(
  '/menu-packages/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await menuPackageController.delete.call(menuPackageController, req, res);
  })
);

/**
 * @route   POST /api/menu-packages/:id/options
 * @desc    Assign options to package
 * @params  id: string
 * @body    AssignOptionsToPackageInput
 * @access  Admin only
 */
router.post(
  '/menu-packages/:id/options',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await menuPackageController.assignOptions.call(menuPackageController, req, res);
  })
);

// ═══════════════════════════════════════════════════════════════
// 📋 PACKAGE CATEGORY SETTINGS
// ═══════════════════════════════════════════════════════════════

/**
 * @route   GET /api/menu-packages/:packageId/categories
 * @desc    Get all category settings for a package
 * @params  packageId: string
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/menu-packages/:packageId/categories',
  authMiddleware,
  requireStaff,
  validateUUID('packageId'),
  asyncHandler(async (req, res) => {
    await packageCategoryController.getByPackage.call(packageCategoryController, req, res);
  })
);

/**
 * @route   PUT /api/menu-packages/:packageId/categories
 * @desc    Bulk update category settings for a package
 * @params  packageId: string
 * @body    BulkUpdateCategorySettingsInput
 * @access  Admin only
 */
router.put(
  '/menu-packages/:packageId/categories',
  authMiddleware,
  requireAdmin,
  validateUUID('packageId'),
  asyncHandler(async (req, res) => {
    await packageCategoryController.bulkUpdate.call(packageCategoryController, req, res);
  })
);

/**
 * @route   GET /api/package-category-settings/:id
 * @desc    Get single category setting
 * @params  id: string
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/package-category-settings/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await packageCategoryController.getById.call(packageCategoryController, req, res);
  })
);

/**
 * @route   POST /api/package-category-settings
 * @desc    Create category setting
 * @body    CreateCategorySettingInput
 * @access  Admin only
 */
router.post(
  '/package-category-settings',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await packageCategoryController.create.call(packageCategoryController, req, res);
  })
);

/**
 * @route   PUT /api/package-category-settings/:id
 * @desc    Update category setting
 * @params  id: string
 * @body    UpdateCategorySettingInput
 * @access  Admin only
 */
router.put(
  '/package-category-settings/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await packageCategoryController.update.call(packageCategoryController, req, res);
  })
);

/**
 * @route   DELETE /api/package-category-settings/:id
 * @desc    Delete category setting
 * @params  id: string
 * @access  Admin only
 */
router.delete(
  '/package-category-settings/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await packageCategoryController.delete.call(packageCategoryController, req, res);
  })
);

// ═══════════════════════════════════════════════════════════════
// 🍔 ADDON GROUPS
// ═══════════════════════════════════════════════════════════════

/**
 * @route   GET /api/addon-groups
 * @desc    List all addon groups (with optional filters)
 * @query   isActive?: boolean, search?: string
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/addon-groups',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res) => {
    await addonGroupController.list.call(addonGroupController, req, res);
  })
);

/**
 * @route   GET /api/addon-groups/:id
 * @desc    Get single addon group by ID
 * @params  id: string
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/addon-groups/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await addonGroupController.getById.call(addonGroupController, req, res);
  })
);

/**
 * @route   POST /api/addon-groups
 * @desc    Create new addon group
 * @body    CreateAddonGroupInput
 * @access  Admin only
 */
router.post(
  '/addon-groups',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await addonGroupController.create.call(addonGroupController, req, res);
  })
);

/**
 * @route   PUT /api/addon-groups/:id
 * @desc    Update addon group
 * @params  id: string
 * @body    UpdateAddonGroupInput
 * @access  Admin only
 */
router.put(
  '/addon-groups/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await addonGroupController.update.call(addonGroupController, req, res);
  })
);

/**
 * @route   DELETE /api/addon-groups/:id
 * @desc    Delete addon group
 * @params  id: string
 * @access  Admin only
 */
router.delete(
  '/addon-groups/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await addonGroupController.delete.call(addonGroupController, req, res);
  })
);

/**
 * @route   PUT /api/addon-groups/:id/dishes
 * @desc    Assign dishes to addon group
 * @params  id: string
 * @body    AssignDishesToGroupInput
 * @access  Admin only
 */
router.put(
  '/addon-groups/:id/dishes',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await addonGroupController.assignDishes.call(addonGroupController, req, res);
  })
);

/**
 * @route   DELETE /api/addon-groups/:groupId/dishes/:dishId
 * @desc    Remove dish from addon group
 * @params  groupId: string, dishId: string
 * @access  Admin only
 */
router.delete(
  '/addon-groups/:groupId/dishes/:dishId',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await addonGroupController.removeDish.call(addonGroupController, req, res);
  })
);

// ═══════════════════════════════════════════════════════════════
// MENU OPTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * @route   GET /api/menu-options
 * @desc    List all menu options (with optional filters)
 * @query   category?: string, isActive?: boolean, search?: string
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/menu-options',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res) => {
    await menuOptionController.list.call(menuOptionController, req, res);
  })
);

/**
 * @route   GET /api/menu-options/:id
 * @desc    Get single option by ID
 * @params  id: string
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/menu-options/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await menuOptionController.getById.call(menuOptionController, req, res);
  })
);

/**
 * @route   POST /api/menu-options
 * @desc    Create new option
 * @body    CreateMenuOptionInput
 * @access  Admin only
 */
router.post(
  '/menu-options',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await menuOptionController.create.call(menuOptionController, req, res);
  })
);

/**
 * @route   PUT /api/menu-options/:id
 * @desc    Update option
 * @params  id: string
 * @body    UpdateMenuOptionInput
 * @access  Admin only
 */
router.put(
  '/menu-options/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await menuOptionController.update.call(menuOptionController, req, res);
  })
);

/**
 * @route   DELETE /api/menu-options/:id
 * @desc    Delete option
 * @params  id: string
 * @access  Admin only
 */
router.delete(
  '/menu-options/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await menuOptionController.delete.call(menuOptionController, req, res);
  })
);

// ═══════════════════════════════════════════════════════════════
// 🍽️ MENU COURSES
// ═══════════════════════════════════════════════════════════════

/**
 * @route   GET /api/menu-courses/package/:packageId
 * @desc    List all courses for a package
 * @params  packageId: string
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/menu-courses/package/:packageId',
  authMiddleware,
  requireStaff,
  validateUUID('packageId'),
  asyncHandler(async (req, res) => {
    await menuCourseController.listByPackage.call(menuCourseController, req, res);
  })
);

/**
 * @route   GET /api/menu-courses/:id
 * @desc    Get single course by ID
 * @params  id: string
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/menu-courses/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await menuCourseController.getById.call(menuCourseController, req, res);
  })
);

/**
 * @route   POST /api/menu-courses
 * @desc    Create new course
 * @body    CreateMenuCourseInput
 * @access  Admin only
 */
router.post(
  '/menu-courses',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await menuCourseController.create.call(menuCourseController, req, res);
  })
);

/**
 * @route   PUT /api/menu-courses/:id
 * @desc    Update course
 * @params  id: string
 * @body    UpdateMenuCourseInput
 * @access  Admin only
 */
router.put(
  '/menu-courses/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await menuCourseController.update.call(menuCourseController, req, res);
  })
);

/**
 * @route   DELETE /api/menu-courses/:id
 * @desc    Delete course
 * @params  id: string
 * @access  Admin only
 */
router.delete(
  '/menu-courses/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await menuCourseController.delete.call(menuCourseController, req, res);
  })
);

/**
 * @route   POST /api/menu-courses/:id/dishes
 * @desc    Assign dishes to course
 * @params  id: string (course ID)
 * @body    AssignDishesToCourseInput
 * @access  Admin only
 */
router.post(
  '/menu-courses/:id/dishes',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await menuCourseController.assignDishes.call(menuCourseController, req, res);
  })
);

/**
 * @route   DELETE /api/menu-courses/:courseId/dishes/:dishId
 * @desc    Remove dish from course
 * @params  courseId: string, dishId: string
 * @access  Admin only
 */
router.delete(
  '/menu-courses/:courseId/dishes/:dishId',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await menuCourseController.removeDish.call(menuCourseController, req, res);
  })
);

// ═══════════════════════════════════════════════════════════════
// RESERVATION MENU SELECTION (STAFF-FACING)
// ═══════════════════════════════════════════════════════════════

/**
 * @route   POST /api/reservations/:id/select-menu
 * @desc    Select menu for reservation (create snapshot)
 * @params  id: string (reservation ID)
 * @body    SelectMenuInput
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.post(
  '/reservations/:id/select-menu',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await reservationMenuController.selectMenu.call(reservationMenuController, req, res);
  })
);

/**
 * @route   GET /api/reservations/:id/menu
 * @desc    Get menu snapshot for reservation
 * @params  id: string (reservation ID)
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/reservations/:id/menu',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await reservationMenuController.getMenu.call(reservationMenuController, req, res);
  })
);

/**
 * @route   PUT /api/reservations/:id/menu
 * @desc    Update menu selection (guest counts)
 * @params  id: string (reservation ID)
 * @body    UpdateMenuSelectionInput
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.put(
  '/reservations/:id/menu',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await reservationMenuController.updateMenu.call(reservationMenuController, req, res);
  })
);

/**
 * @route   DELETE /api/reservations/:id/menu
 * @desc    Remove menu selection
 * @params  id: string (reservation ID)
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.delete(
  '/reservations/:id/menu',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await reservationMenuController.deleteMenu.call(reservationMenuController, req, res);
  })
);

// ═══════════════════════════════════════════════════════════════
// EXPORT ROUTER
// ═══════════════════════════════════════════════════════════════

export default router;

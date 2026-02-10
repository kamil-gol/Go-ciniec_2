/**
 * Menu Routes
 * 
 * Express router for all menu-related endpoints
 */

import { Router } from 'express';
import { menuTemplateController } from '../controllers/menuTemplate.controller';
import { menuPackageController } from '../controllers/menuPackage.controller';
import { menuOptionController } from '../controllers/menuOption.controller';
import { reservationMenuController } from '../controllers/reservationMenu.controller';
import { dishController } from '../controllers/dish.controller';
import { menuCourseController } from '../controllers/menuCourse.controller';

// TODO: Import authentication middleware when ready
// import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// MENU TEMPLATES
// ═══════════════════════════════════════════════════════════════

/**
 * @route   GET /api/menu-templates
 * @desc    List all menu templates (with optional filters)
 * @query   eventTypeId?: string, isActive?: boolean, date?: string
 * @access  Public
 */
router.get(
  '/menu-templates',
  menuTemplateController.list.bind(menuTemplateController)
);

/**
 * @route   GET /api/menu-templates/active/:eventTypeId
 * @desc    Get active menu template for event type on specific date
 * @params  eventTypeId: string
 * @query   date?: string (defaults to today)
 * @access  Public
 */
router.get(
  '/menu-templates/active/:eventTypeId',
  menuTemplateController.getActive.bind(menuTemplateController)
);

/**
 * @route   GET /api/menu-templates/:id
 * @desc    Get single menu template by ID
 * @params  id: string
 * @access  Public
 */
router.get(
  '/menu-templates/:id',
  menuTemplateController.getById.bind(menuTemplateController)
);

/**
 * @route   POST /api/menu-templates
 * @desc    Create new menu template
 * @body    CreateMenuTemplateInput
 * @access  Admin only
 */
router.post(
  '/menu-templates',
  // requireAdmin,  // TODO: Uncomment when auth ready
  menuTemplateController.create.bind(menuTemplateController)
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
  // requireAdmin,  // TODO: Uncomment when auth ready
  menuTemplateController.update.bind(menuTemplateController)
);

/**
 * @route   DELETE /api/menu-templates/:id
 * @desc    Delete menu template
 * @params  id: string
 * @access  Admin only
 */
router.delete(
  '/menu-templates/:id',
  // requireAdmin,  // TODO: Uncomment when auth ready
  menuTemplateController.delete.bind(menuTemplateController)
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
  // requireAdmin,  // TODO: Uncomment when auth ready
  menuTemplateController.duplicate.bind(menuTemplateController)
);

// ═══════════════════════════════════════════════════════════════
// MENU PACKAGES
// ═══════════════════════════════════════════════════════════════

/**
 * @route   GET /api/menu-packages/template/:templateId
 * @desc    List all packages for a menu template
 * @params  templateId: string
 * @access  Public
 */
router.get(
  '/menu-packages/template/:templateId',
  menuPackageController.listByTemplate.bind(menuPackageController)
);

/**
 * @route   GET /api/menu-packages/:id
 * @desc    Get single package by ID
 * @params  id: string
 * @access  Public
 */
router.get(
  '/menu-packages/:id',
  menuPackageController.getById.bind(menuPackageController)
);

/**
 * @route   POST /api/menu-packages
 * @desc    Create new package
 * @body    CreateMenuPackageInput
 * @access  Admin only
 */
router.post(
  '/menu-packages',
  // requireAdmin,  // TODO: Uncomment when auth ready
  menuPackageController.create.bind(menuPackageController)
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
  // requireAdmin,  // TODO: Uncomment when auth ready
  menuPackageController.update.bind(menuPackageController)
);

/**
 * @route   DELETE /api/menu-packages/:id
 * @desc    Delete package
 * @params  id: string
 * @access  Admin only
 */
router.delete(
  '/menu-packages/:id',
  // requireAdmin,  // TODO: Uncomment when auth ready
  menuPackageController.delete.bind(menuPackageController)
);

/**
 * @route   PUT /api/menu-packages/reorder
 * @desc    Reorder packages (drag & drop)
 * @body    ReorderPackagesInput
 * @access  Admin only
 */
router.put(
  '/menu-packages/reorder',
  // requireAdmin,  // TODO: Uncomment when auth ready
  menuPackageController.reorder.bind(menuPackageController)
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
  // requireAdmin,  // TODO: Uncomment when auth ready
  menuPackageController.assignOptions.bind(menuPackageController)
);

// ═══════════════════════════════════════════════════════════════
// MENU OPTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * @route   GET /api/menu-options
 * @desc    List all menu options (with optional filters)
 * @query   category?: string, isActive?: boolean, search?: string
 * @access  Public
 */
router.get(
  '/menu-options',
  menuOptionController.list.bind(menuOptionController)
);

/**
 * @route   GET /api/menu-options/:id
 * @desc    Get single option by ID
 * @params  id: string
 * @access  Public
 */
router.get(
  '/menu-options/:id',
  menuOptionController.getById.bind(menuOptionController)
);

/**
 * @route   POST /api/menu-options
 * @desc    Create new option
 * @body    CreateMenuOptionInput
 * @access  Admin only
 */
router.post(
  '/menu-options',
  // requireAdmin,  // TODO: Uncomment when auth ready
  menuOptionController.create.bind(menuOptionController)
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
  // requireAdmin,  // TODO: Uncomment when auth ready
  menuOptionController.update.bind(menuOptionController)
);

/**
 * @route   DELETE /api/menu-options/:id
 * @desc    Delete option
 * @params  id: string
 * @access  Admin only
 */
router.delete(
  '/menu-options/:id',
  // requireAdmin,  // TODO: Uncomment when auth ready
  menuOptionController.delete.bind(menuOptionController)
);

// ═══════════════════════════════════════════════════════════════
// 🍽️ DISH LIBRARY (NEW)
// ═══════════════════════════════════════════════════════════════

/**
 * @route   GET /api/dishes
 * @desc    List all dishes in library (with optional filters)
 * @query   category?: DishCategory, isActive?: boolean, search?: string
 * @access  Public
 */
router.get(
  '/dishes',
  dishController.list.bind(dishController)
);

/**
 * @route   GET /api/dishes/:id
 * @desc    Get single dish by ID
 * @params  id: string
 * @access  Public
 */
router.get(
  '/dishes/:id',
  dishController.getById.bind(dishController)
);

/**
 * @route   POST /api/dishes
 * @desc    Create new dish
 * @body    CreateDishInput
 * @access  Admin only
 */
router.post(
  '/dishes',
  // requireAdmin,  // TODO: Uncomment when auth ready
  dishController.create.bind(dishController)
);

/**
 * @route   PUT /api/dishes/:id
 * @desc    Update dish
 * @params  id: string
 * @body    UpdateDishInput
 * @access  Admin only
 */
router.put(
  '/dishes/:id',
  // requireAdmin,  // TODO: Uncomment when auth ready
  dishController.update.bind(dishController)
);

/**
 * @route   DELETE /api/dishes/:id
 * @desc    Delete dish
 * @params  id: string
 * @access  Admin only
 */
router.delete(
  '/dishes/:id',
  // requireAdmin,  // TODO: Uncomment when auth ready
  dishController.delete.bind(dishController)
);

// ═══════════════════════════════════════════════════════════════
// 🍽️ MENU COURSES (NEW)
// ═══════════════════════════════════════════════════════════════

/**
 * @route   GET /api/menu-courses/package/:packageId
 * @desc    List all courses for a package
 * @params  packageId: string
 * @access  Public
 */
router.get(
  '/menu-courses/package/:packageId',
  menuCourseController.listByPackage.bind(menuCourseController)
);

/**
 * @route   GET /api/menu-courses/:id
 * @desc    Get single course by ID
 * @params  id: string
 * @access  Public
 */
router.get(
  '/menu-courses/:id',
  menuCourseController.getById.bind(menuCourseController)
);

/**
 * @route   POST /api/menu-courses
 * @desc    Create new course
 * @body    CreateMenuCourseInput
 * @access  Admin only
 */
router.post(
  '/menu-courses',
  // requireAdmin,  // TODO: Uncomment when auth ready
  menuCourseController.create.bind(menuCourseController)
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
  // requireAdmin,  // TODO: Uncomment when auth ready
  menuCourseController.update.bind(menuCourseController)
);

/**
 * @route   DELETE /api/menu-courses/:id
 * @desc    Delete course
 * @params  id: string
 * @access  Admin only
 */
router.delete(
  '/menu-courses/:id',
  // requireAdmin,  // TODO: Uncomment when auth ready
  menuCourseController.delete.bind(menuCourseController)
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
  // requireAdmin,  // TODO: Uncomment when auth ready
  menuCourseController.assignDishes.bind(menuCourseController)
);

/**
 * @route   DELETE /api/menu-courses/:courseId/dishes/:dishId
 * @desc    Remove dish from course
 * @params  courseId: string, dishId: string
 * @access  Admin only
 */
router.delete(
  '/menu-courses/:courseId/dishes/:dishId',
  // requireAdmin,  // TODO: Uncomment when auth ready
  menuCourseController.removeDish.bind(menuCourseController)
);

// ═══════════════════════════════════════════════════════════════
// RESERVATION MENU SELECTION (CLIENT-FACING)
// ═══════════════════════════════════════════════════════════════

/**
 * @route   POST /api/reservations/:id/select-menu
 * @desc    Select menu for reservation (create snapshot)
 * @params  id: string (reservation ID)
 * @body    SelectMenuInput
 * @access  Authenticated (reservation owner or admin)
 */
router.post(
  '/reservations/:id/select-menu',
  // authenticate,  // TODO: Uncomment when auth ready
  reservationMenuController.selectMenu.bind(reservationMenuController)
);

/**
 * @route   GET /api/reservations/:id/menu
 * @desc    Get menu snapshot for reservation
 * @params  id: string (reservation ID)
 * @access  Authenticated (reservation owner or admin)
 */
router.get(
  '/reservations/:id/menu',
  // authenticate,  // TODO: Uncomment when auth ready
  reservationMenuController.getMenu.bind(reservationMenuController)
);

/**
 * @route   PUT /api/reservations/:id/menu
 * @desc    Update menu selection (guest counts)
 * @params  id: string (reservation ID)
 * @body    UpdateMenuSelectionInput
 * @access  Authenticated (reservation owner or admin)
 */
router.put(
  '/reservations/:id/menu',
  // authenticate,  // TODO: Uncomment when auth ready
  reservationMenuController.updateMenu.bind(reservationMenuController)
);

/**
 * @route   DELETE /api/reservations/:id/menu
 * @desc    Remove menu selection
 * @params  id: string (reservation ID)
 * @access  Authenticated (reservation owner or admin)
 */
router.delete(
  '/reservations/:id/menu',
  // authenticate,  // TODO: Uncomment when auth ready
  reservationMenuController.deleteMenu.bind(reservationMenuController)
);

// ═══════════════════════════════════════════════════════════════
// EXPORT ROUTER
// ═══════════════════════════════════════════════════════════════

export default router;

// Usage in main app.ts:
// import menuRoutes from './routes/menu.routes';
// app.use('/api', menuRoutes);

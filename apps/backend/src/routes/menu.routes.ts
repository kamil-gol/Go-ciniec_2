/**
 * Menu Routes
 * 
 * Express router for all menu-related endpoints
 * Auth: GET = requireStaff, POST/PUT/DELETE = requireAdmin
 *
 * IMPORTANT: All asyncHandler wrappers MUST pass (req, res, next) and forward
 * next to controller methods. Controllers use next(error) for non-handled errors.
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

// ═════════════════════════════════════════════════════════════════
// MENU TEMPLATES
// ═════════════════════════════════════════════════════════════════

router.get(
  '/menu-templates',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res, next) => {
    await menuTemplateController.list.call(menuTemplateController, req, res, next);
  })
);

router.get(
  '/menu-templates/active/:eventTypeId',
  authMiddleware,
  requireStaff,
  validateUUID('eventTypeId'),
  asyncHandler(async (req, res, next) => {
    await menuTemplateController.getActive.call(menuTemplateController, req, res, next);
  })
);

router.get(
  '/menu-templates/:id/pdf',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await menuTemplateController.downloadPdf.call(menuTemplateController, req, res);
  })
);

router.get(
  '/menu-templates/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await menuTemplateController.getById.call(menuTemplateController, req, res, next);
  })
);

router.post(
  '/menu-templates',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res, next) => {
    await menuTemplateController.create.call(menuTemplateController, req, res, next);
  })
);

router.put(
  '/menu-templates/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await menuTemplateController.update.call(menuTemplateController, req, res, next);
  })
);

router.delete(
  '/menu-templates/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await menuTemplateController.delete.call(menuTemplateController, req, res, next);
  })
);

router.post(
  '/menu-templates/:id/duplicate',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await menuTemplateController.duplicate.call(menuTemplateController, req, res, next);
  })
);

// ═════════════════════════════════════════════════════════════════
// MENU PACKAGES
// ═════════════════════════════════════════════════════════════════

router.get(
  '/menu-packages',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res, next) => {
    await menuPackageController.list.call(menuPackageController, req, res, next);
  })
);

router.get(
  '/menu-packages/event-type/:eventTypeId',
  authMiddleware,
  requireStaff,
  validateUUID('eventTypeId'),
  asyncHandler(async (req, res, next) => {
    await menuPackageController.listByEventType.call(menuPackageController, req, res, next);
  })
);

router.get(
  '/menu-packages/template/:templateId',
  authMiddleware,
  requireStaff,
  validateUUID('templateId'),
  asyncHandler(async (req, res, next) => {
    await menuPackageController.listByTemplate.call(menuPackageController, req, res, next);
  })
);

router.put(
  '/menu-packages/reorder',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res, next) => {
    await menuPackageController.reorder.call(menuPackageController, req, res, next);
  })
);

router.get(
  '/menu-packages/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await menuPackageController.getById.call(menuPackageController, req, res, next);
  })
);

router.post(
  '/menu-packages',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res, next) => {
    await menuPackageController.create.call(menuPackageController, req, res, next);
  })
);

router.put(
  '/menu-packages/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await menuPackageController.update.call(menuPackageController, req, res, next);
  })
);

router.delete(
  '/menu-packages/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await menuPackageController.delete.call(menuPackageController, req, res, next);
  })
);

router.post(
  '/menu-packages/:id/options',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await menuPackageController.assignOptions.call(menuPackageController, req, res, next);
  })
);

// ═════════════════════════════════════════════════════════════════
// PACKAGE CATEGORY SETTINGS
// ═════════════════════════════════════════════════════════════════

router.get(
  '/menu-packages/:packageId/categories',
  authMiddleware,
  requireStaff,
  validateUUID('packageId'),
  asyncHandler(async (req, res) => {
    await packageCategoryController.getByPackage.call(packageCategoryController, req, res);
  })
);

router.put(
  '/menu-packages/:packageId/categories',
  authMiddleware,
  requireAdmin,
  validateUUID('packageId'),
  asyncHandler(async (req, res) => {
    await packageCategoryController.bulkUpdate.call(packageCategoryController, req, res);
  })
);

router.get(
  '/package-category-settings/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await packageCategoryController.getById.call(packageCategoryController, req, res);
  })
);

router.post(
  '/package-category-settings',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await packageCategoryController.create.call(packageCategoryController, req, res);
  })
);

router.put(
  '/package-category-settings/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await packageCategoryController.update.call(packageCategoryController, req, res);
  })
);

router.delete(
  '/package-category-settings/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await packageCategoryController.delete.call(packageCategoryController, req, res);
  })
);

// ═════════════════════════════════════════════════════════════════
// ADDON GROUPS
// ═════════════════════════════════════════════════════════════════

router.get(
  '/addon-groups',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res, next) => {
    await addonGroupController.list.call(addonGroupController, req, res, next);
  })
);

router.get(
  '/addon-groups/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await addonGroupController.getById.call(addonGroupController, req, res, next);
  })
);

router.post(
  '/addon-groups',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res, next) => {
    await addonGroupController.create.call(addonGroupController, req, res, next);
  })
);

router.put(
  '/addon-groups/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await addonGroupController.update.call(addonGroupController, req, res, next);
  })
);

router.delete(
  '/addon-groups/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await addonGroupController.delete.call(addonGroupController, req, res, next);
  })
);

router.put(
  '/addon-groups/:id/dishes',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await addonGroupController.assignDishes.call(addonGroupController, req, res, next);
  })
);

router.delete(
  '/addon-groups/:groupId/dishes/:dishId',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res, next) => {
    await addonGroupController.removeDish.call(addonGroupController, req, res, next);
  })
);

// ═════════════════════════════════════════════════════════════════
// MENU OPTIONS
// ═════════════════════════════════════════════════════════════════

router.get(
  '/menu-options',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res, next) => {
    await menuOptionController.list.call(menuOptionController, req, res, next);
  })
);

router.get(
  '/menu-options/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await menuOptionController.getById.call(menuOptionController, req, res, next);
  })
);

router.post(
  '/menu-options',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res, next) => {
    await menuOptionController.create.call(menuOptionController, req, res, next);
  })
);

router.put(
  '/menu-options/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await menuOptionController.update.call(menuOptionController, req, res, next);
  })
);

router.delete(
  '/menu-options/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await menuOptionController.delete.call(menuOptionController, req, res, next);
  })
);

// ═════════════════════════════════════════════════════════════════
// MENU COURSES
// ═════════════════════════════════════════════════════════════════

router.get(
  '/menu-courses/package/:packageId',
  authMiddleware,
  requireStaff,
  validateUUID('packageId'),
  asyncHandler(async (req, res, next) => {
    await menuCourseController.listByPackage.call(menuCourseController, req, res, next);
  })
);

router.get(
  '/menu-courses/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await menuCourseController.getById.call(menuCourseController, req, res, next);
  })
);

router.post(
  '/menu-courses',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res, next) => {
    await menuCourseController.create.call(menuCourseController, req, res, next);
  })
);

router.put(
  '/menu-courses/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await menuCourseController.update.call(menuCourseController, req, res, next);
  })
);

router.delete(
  '/menu-courses/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await menuCourseController.delete.call(menuCourseController, req, res, next);
  })
);

router.post(
  '/menu-courses/:id/dishes',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await menuCourseController.assignDishes.call(menuCourseController, req, res, next);
  })
);

router.delete(
  '/menu-courses/:courseId/dishes/:dishId',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res, next) => {
    await menuCourseController.removeDish.call(menuCourseController, req, res, next);
  })
);

// ═════════════════════════════════════════════════════════════════
// RESERVATION MENU SELECTION (STAFF-FACING)
// ═════════════════════════════════════════════════════════════════

router.post(
  '/reservations/:id/select-menu',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await reservationMenuController.selectMenu.call(reservationMenuController, req, res);
  })
);

router.get(
  '/reservations/:id/menu',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await reservationMenuController.getMenu.call(reservationMenuController, req, res);
  })
);

router.put(
  '/reservations/:id/menu',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await reservationMenuController.updateMenu.call(reservationMenuController, req, res);
  })
);

router.delete(
  '/reservations/:id/menu',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await reservationMenuController.deleteMenu.call(reservationMenuController, req, res);
  })
);

export default router;

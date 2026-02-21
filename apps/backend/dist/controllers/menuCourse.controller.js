/**
 * Menu Course Controller
 *
 * HTTP handlers for menu course operations
 */
import { menuCourseService } from '../services/menuCourse.service';
import { createMenuCourseSchema, updateMenuCourseSchema, assignDishesToCourseSchema } from '../validation/menuCourse.validation';
import { z } from 'zod';
export class MenuCourseController {
    /**
     * GET /api/menu-courses/package/:packageId
     * List all courses for a package
     */
    async listByPackage(req, res, next) {
        try {
            const { packageId } = req.params;
            const courses = await menuCourseService.listByPackage(packageId);
            return res.status(200).json({
                success: true,
                data: courses,
                count: courses.length
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/menu-courses/:id
     * Get single course by ID
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const course = await menuCourseService.getById(id);
            return res.status(200).json({
                success: true,
                data: course
            });
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Course not found') {
                return res.status(404).json({
                    success: false,
                    error: 'Course not found'
                });
            }
            next(error);
        }
    }
    /**
     * POST /api/menu-courses
     * Create new course (ADMIN only)
     */
    async create(req, res, next) {
        try {
            // Validate request body
            const data = createMenuCourseSchema.parse(req.body);
            const course = await menuCourseService.create(data);
            return res.status(201).json({
                success: true,
                data: course,
                message: 'Course created successfully'
            });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.errors
                });
            }
            if (error instanceof Error && error.message === 'Package not found') {
                return res.status(404).json({
                    success: false,
                    error: 'Package not found'
                });
            }
            next(error);
        }
    }
    /**
     * PUT /api/menu-courses/:id
     * Update course (ADMIN only)
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            // Validate request body
            const data = updateMenuCourseSchema.parse(req.body);
            const course = await menuCourseService.update(id, data);
            return res.status(200).json({
                success: true,
                data: course,
                message: 'Course updated successfully'
            });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.errors
                });
            }
            if (error instanceof Error && error.message === 'Course not found') {
                return res.status(404).json({
                    success: false,
                    error: 'Course not found'
                });
            }
            next(error);
        }
    }
    /**
     * DELETE /api/menu-courses/:id
     * Delete course (ADMIN only)
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await menuCourseService.delete(id);
            return res.status(200).json({
                success: true,
                message: 'Course deleted successfully'
            });
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Course not found') {
                return res.status(404).json({
                    success: false,
                    error: 'Course not found'
                });
            }
            next(error);
        }
    }
    /**
     * POST /api/menu-courses/:id/dishes
     * Assign dishes to course (ADMIN only)
     */
    async assignDishes(req, res, next) {
        try {
            const { id } = req.params;
            // Validate request body
            const data = assignDishesToCourseSchema.parse(req.body);
            const course = await menuCourseService.assignDishes(id, data.dishes);
            return res.status(200).json({
                success: true,
                data: course,
                message: 'Dishes assigned successfully'
            });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.errors
                });
            }
            if (error instanceof Error && error.message === 'Course not found') {
                return res.status(404).json({
                    success: false,
                    error: 'Course not found'
                });
            }
            if (error instanceof Error && error.message.includes('Dish')) {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    }
    /**
     * DELETE /api/menu-courses/:courseId/dishes/:dishId
     * Remove dish from course (ADMIN only)
     */
    async removeDish(req, res, next) {
        try {
            const { courseId, dishId } = req.params;
            await menuCourseService.removeDish(courseId, dishId);
            return res.status(200).json({
                success: true,
                message: 'Dish removed from course successfully'
            });
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Course not found') {
                return res.status(404).json({
                    success: false,
                    error: 'Course not found'
                });
            }
            if (error instanceof Error && error.message === 'Dish not assigned to this course') {
                return res.status(404).json({
                    success: false,
                    error: 'Dish not assigned to this course'
                });
            }
            next(error);
        }
    }
}
export const menuCourseController = new MenuCourseController();
//# sourceMappingURL=menuCourse.controller.js.map
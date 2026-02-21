/**
 * Menu Course Controller
 *
 * HTTP handlers for menu course operations
 */
import { Request, Response, NextFunction } from 'express';
export declare class MenuCourseController {
    /**
     * GET /api/menu-courses/package/:packageId
     * List all courses for a package
     */
    listByPackage(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/menu-courses/:id
     * Get single course by ID
     */
    getById(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/menu-courses
     * Create new course (ADMIN only)
     */
    create(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PUT /api/menu-courses/:id
     * Update course (ADMIN only)
     */
    update(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * DELETE /api/menu-courses/:id
     * Delete course (ADMIN only)
     */
    delete(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/menu-courses/:id/dishes
     * Assign dishes to course (ADMIN only)
     */
    assignDishes(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * DELETE /api/menu-courses/:courseId/dishes/:dishId
     * Remove dish from course (ADMIN only)
     */
    removeDish(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const menuCourseController: MenuCourseController;
//# sourceMappingURL=menuCourse.controller.d.ts.map
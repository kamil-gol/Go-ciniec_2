/**
 * Dish Controller - with userId for audit
 */
import { Request, Response } from 'express';
declare class DishController {
    getDishes(req: Request, res: Response): Promise<void>;
    getDishById(req: Request, res: Response): Promise<void>;
    getDishesByCategory(req: Request, res: Response): Promise<void>;
    createDish(req: Request, res: Response): Promise<void>;
    updateDish(req: Request, res: Response): Promise<void>;
    deleteDish(req: Request, res: Response): Promise<void>;
}
declare const _default: DishController;
export default _default;
//# sourceMappingURL=dish.controller.d.ts.map
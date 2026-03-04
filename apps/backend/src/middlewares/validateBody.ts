import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware do walidacji req.body przez Zod schema.
 * Przy błędzie zwraca 400 z listą błędów walidacji.
 * Przy sukcesie przypisuje sparsowane dane do req.body i woła next().
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = (result.error as ZodError).errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({
        success: false,
        error: 'Błąd walidacji danych',
        details: errors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

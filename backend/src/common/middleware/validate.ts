import type { Request, RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Validates and replaces req.body / req.query / req.params with the parsed (coerced, stripped) value.
 * ZodErrors are turned into a 422 by the central error handler.
 */
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req: Request, _res, next) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) (req as { query: unknown }).query = schemas.query.parse(req.query);
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validateRequest =
  (schema: { body?: ZodSchema; query?: ZodSchema; params?: ZodSchema }) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        const parsedQuery = schema.query.parse(req.query);
        req.query = parsedQuery as unknown as typeof req.query;
      }
      if (schema.params) {
        const parsedParams = schema.params.parse(req.params);
        req.params = parsedParams as unknown as typeof req.params;
      }
      next();
    } catch (error) {
      next(error);
    }
  };

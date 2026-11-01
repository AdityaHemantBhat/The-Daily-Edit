import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

export const validate =
  (schema: ZodTypeAny, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    if (source === 'body') req.body = result.data;
    else Object.assign(req[source] as object, result.data);
    next();
  };

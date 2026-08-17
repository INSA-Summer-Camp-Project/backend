import type { NextFunction, Request, Response } from "express";
import type { ParsedQs } from "qs";
import type { ZodTypeAny } from "zod";

interface ValidationSchemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

export const validate =
  (schemas: ValidationSchemas | ZodTypeAny) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Support single schema (body shorthand) or multi-schema
      if ("parseAsync" in schemas) {
        req.body = await schemas.parseAsync(req.body);
      } else {
        if (schemas.body) req.body = await schemas.body.parseAsync(req.body);
        if (schemas.params)
          req.params = (await schemas.params.parseAsync(req.params)) as Record<
            string,
            string
          >;
        if (schemas.query)
          req.query = (await schemas.query.parseAsync(
            req.query,
          )) as unknown as ParsedQs;
      }
      next();
    } catch (error) {
      next(error);
    }
  };

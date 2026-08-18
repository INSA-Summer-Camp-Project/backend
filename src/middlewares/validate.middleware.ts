import type { RequestHandler } from "express";
import type { ParsedQs } from "qs";
import type { ZodTypeAny } from "zod";

interface ValidationSchemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

export const validate =
  <
    P = Record<string, string>,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = ParsedQs,
  >(
    schemas: ValidationSchemas | ZodTypeAny,
  ): RequestHandler<P, ResBody, ReqBody, ReqQuery> =>
  async (req, _res, next): Promise<void> => {
    try {
      // Support single schema (body shorthand) or multi-schema
      if ("parseAsync" in schemas) {
        req.body = (await schemas.parseAsync(req.body)) as ReqBody;
      } else {
        if (schemas.body)
          req.body = (await schemas.body.parseAsync(req.body)) as ReqBody;
        if (schemas.params)
          req.params = (await schemas.params.parseAsync(req.params)) as P;
        if (schemas.query)
          req.query = (await schemas.query.parseAsync(req.query)) as ReqQuery;
      }
      next();
    } catch (error) {
      next(error);
    }
  };

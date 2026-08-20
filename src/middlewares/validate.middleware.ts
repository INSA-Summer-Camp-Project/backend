import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

interface ValidationSchemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

/**
 * Zod validation middleware.
 *
 * Supports two call signatures:
 *   validate(schema)             – validates body only (backward-compatible)
 *   validate(schema, "query")    – validates the given target (backward-compatible)
 *   validate({ body, params, query }) – validates multiple targets at once
 */
export const validate = <
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, unknown>,
>(
  schemas: ValidationSchemas | ZodTypeAny,
  target?: "body" | "query" | "params",
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return async (req, _res, next): Promise<void> => {
    try {
      // Legacy 2-arg call: validate(schema, "query")
      if (target) {
        const parsed = await (schemas as ZodTypeAny).parseAsync(req[target]);
        if (target === "query") {
          Object.defineProperty(req, "query", {
            value: parsed,
            writable: true,
            configurable: true,
          });
        } else {
          Object.defineProperty(req, target, {
            value: parsed,
            writable: true,
            configurable: true,
          });
        }
        next();
        return;
      }

      // Single schema shorthand: validate(bodySchema)
      if ("parseAsync" in schemas) {
        req.body = (await (schemas as ZodTypeAny).parseAsync(
          req.body,
        )) as ReqBody;
        next();
        return;
      }

      // Multi-schema object: validate({ body, params, query })
      const s = schemas as ValidationSchemas;
      if (s.body) req.body = (await s.body.parseAsync(req.body)) as ReqBody;
      if (s.params) req.params = (await s.params.parseAsync(req.params)) as P;
      if (s.query) {
        const parsed = (await s.query.parseAsync(req.query)) as ReqQuery;
        Object.defineProperty(req, "query", {
          value: parsed,
          writable: true,
          configurable: true,
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

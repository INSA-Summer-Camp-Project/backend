import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

/**
 * Express middleware for validating request data against a Zod schema.
 * Supports validating 'body', 'query', or 'params' targets.
 *
 * NOTE: `req.query` is a read-only getter on Node's IncomingMessage, so we
 * cannot reassign it. For query validation we use Object.defineProperty to
 * shadow the getter with the parsed (and coerced) values.
 *
 * @param schema - Zod schema to validate against
 * @param target - The request property to validate: 'body' | 'query' | 'params' (defaults to 'body')
 */
export const validate =
  (schema: ZodSchema, target: "body" | "query" | "params" = "body") =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedData = await schema.parseAsync(req[target]);

      if (target === "query") {
        // req.query is a read-only property; shadow it via Object.defineProperty
        Object.defineProperty(req, "query", {
          value: parsedData,
          writable: true,
          configurable: true,
        });
      } else {
        req[target] = parsedData;
      }

      next();
    } catch (error) {
      next(error);
    }
  };

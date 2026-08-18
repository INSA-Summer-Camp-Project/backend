import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

/**
 * Express middleware for validating request data against a Zod schema.
 * Supports validating 'body', 'query', or 'params' targets.
 *
 * @param schema - Zod schema to validate against
 * @param target - The request property to validate: 'body' | 'query' | 'params' (defaults to 'body')
 */
export const validate =
  (schema: ZodSchema, target: "body" | "query" | "params" = "body") =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Asynchronously parse and sanitize input data from the specified target location
      const parsedData = await schema.parseAsync(req[target]);

      // Assign transformed/sanitized data back to the request object
      req[target] = parsedData;

      next();
    } catch (error) {
      // Forward Zod validation errors to global error handling middleware
      next(error);
    }
  };

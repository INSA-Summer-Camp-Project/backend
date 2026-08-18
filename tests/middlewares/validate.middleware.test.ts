import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { validate } from "@/middlewares/validate.middleware";

describe("Validate Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
    };
    mockRes = {};
    mockNext = vi.fn();
  });

  describe("Shorthand usage (single schema for body)", () => {
    it("should successfully parse and replace req.body", async () => {
      const schema = z.object({ email: z.string().email() });
      mockReq.body = { email: "test@example.com", extra: "dropped" };

      const middleware = validate(schema);
      await middleware(
        mockReq as unknown as Parameters<typeof middleware>[0],
        mockRes as unknown as Parameters<typeof middleware>[1],
        mockNext,
      );

      expect(mockReq.body).toEqual({ email: "test@example.com" });
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it("should pass ZodError to next on validation failure", async () => {
      const schema = z.object({ email: z.string().email() });
      mockReq.body = { email: "invalid" };

      const middleware = validate(schema);
      await middleware(
        mockReq as unknown as Parameters<typeof middleware>[0],
        mockRes as unknown as Parameters<typeof middleware>[1],
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(z.ZodError));
    });
  });

  describe("Multi-schema usage (body, params, query)", () => {
    it("should successfully parse and replace all specified fields", async () => {
      const schemas = {
        body: z.object({ name: z.string() }),
        params: z.object({ id: z.coerce.number() }),
        query: z.object({ search: z.string().optional() }),
      };

      mockReq.body = { name: "John", extra: "dropped" };
      mockReq.params = { id: "123" };
      mockReq.query = { search: "test", extraQuery: "dropped" };

      const middleware = validate(schemas);
      await middleware(
        mockReq as unknown as Parameters<typeof middleware>[0],
        mockRes as unknown as Parameters<typeof middleware>[1],
        mockNext,
      );

      expect(mockReq.body).toEqual({ name: "John" });
      expect(mockReq.params).toEqual({ id: 123 });
      expect(mockReq.query).toEqual({ search: "test" });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should pass ZodError to next if any validation fails", async () => {
      const schemas = {
        body: z.object({ name: z.string() }),
        params: z.object({ id: z.coerce.number() }),
      };

      mockReq.body = { name: "John" };
      mockReq.params = { id: "not-a-number" };

      const middleware = validate(schemas);
      await middleware(
        mockReq as unknown as Parameters<typeof middleware>[0],
        mockRes as unknown as Parameters<typeof middleware>[1],
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(z.ZodError));
    });
  });
});

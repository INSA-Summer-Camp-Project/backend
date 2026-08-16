import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "@/app";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";

vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      customer: {
        create: vi.fn(),
      },
      worker: {
        create: vi.fn(),
      },
      business: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

interface MockUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  telegramId?: string | null;
  telegramUsername?: string | null;
  role: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
  customer?: { id: string; createdAt: Date; updatedAt: Date } | null;
  worker?: { id: string; createdAt: Date; updatedAt: Date } | null;
  business?: { id: string; createdAt: Date; updatedAt: Date } | null;
}

describe("Auth Integration Tests (/api/v1/auth)", () => {
  let mockDbUsers: MockUserRecord[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    mockDbUsers = [];

    (
      vi.mocked(prisma.user.findUnique) as unknown as {
        mockImplementation: (
          fn: (args: {
            where: { email?: string; phone?: string; id?: string };
          }) => Promise<MockUserRecord | null>,
        ) => void;
      }
    ).mockImplementation(async ({ where }) => {
      if (where.email) {
        return mockDbUsers.find((u) => u.email === where.email) || null;
      }
      if (where.phone) {
        return mockDbUsers.find((u) => u.phone === where.phone) || null;
      }
      if (where.id) {
        return mockDbUsers.find((u) => u.id === where.id) || null;
      }
      return null;
    });

    (
      vi.mocked(prisma.user.findFirst) as unknown as {
        mockImplementation: (
          fn: (args: {
            where?: { OR?: Array<{ email?: string; phone?: string }> };
          }) => Promise<MockUserRecord | null>,
        ) => void;
      }
    ).mockImplementation(async ({ where }) => {
      if (where?.OR && Array.isArray(where.OR)) {
        for (const condition of where.OR) {
          if (condition.email) {
            const found = mockDbUsers.find((u) => u.email === condition.email);
            if (found) return found;
          }
          if (condition.phone) {
            const found = mockDbUsers.find((u) => u.phone === condition.phone);
            if (found) return found;
          }
        }
      }
      return null;
    });

    (
      vi.mocked(prisma.$transaction) as unknown as {
        mockImplementation: (
          fn: (cb: (tx: unknown) => Promise<unknown>) => Promise<unknown>,
        ) => void;
      }
    ).mockImplementation(async (cb) => {
      const tx = {
        user: {
          create: vi.fn().mockImplementation(
            async ({
              data,
            }: {
              data: {
                name: string;
                email: string;
                phone?: string;
                passwordHash: string;
                telegramUsername?: string;
                role: string;
              };
            }) => {
              const id = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              const userObj: MockUserRecord = {
                id,
                name: data.name,
                email: data.email,
                phone: data.phone || null,
                passwordHash: data.passwordHash,
                telegramId: null,
                telegramUsername: data.telegramUsername || null,
                role: data.role,
                status: "ACTIVE",
                createdAt: new Date(),
                updatedAt: new Date(),
                customer:
                  data.role === "CUSTOMER"
                    ? {
                        id: `cust-${id}`,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      }
                    : null,
                worker:
                  data.role === "WORKER"
                    ? {
                        id: `work-${id}`,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      }
                    : null,
                business:
                  data.role === "BUSINESS"
                    ? {
                        id: `biz-${id}`,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      }
                    : null,
              };
              mockDbUsers.push(userObj);
              return userObj;
            },
          ),
          findUnique: vi
            .fn()
            .mockImplementation(
              async ({ where }: { where: { id: string } }) => {
                const found = mockDbUsers.find((u) => u.id === where.id);
                if (!found) return null;
                const { passwordHash: _, ...publicUser } = found;
                return publicUser;
              },
            ),
        },
        customer: { create: vi.fn().mockResolvedValue({}) },
        worker: { create: vi.fn().mockResolvedValue({}) },
        business: { create: vi.fn().mockResolvedValue({}) },
      };
      return cb(tx);
    });
  });

  describe("POST /api/v1/auth/register", () => {
    it("should successfully register a customer user with valid phone", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Alice Customer",
        email: "alice@example.com",
        phone: "+1234567890",
        password: "password123",
        role: "CUSTOMER",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe("alice@example.com");
      expect(res.body.data.role).toBe("CUSTOMER");
      expect(res.body.data.customer).toBeDefined();
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it("should reject customer registration missing mandatory phone (FR-002)", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Bob NoPhone",
        email: "bob@example.com",
        password: "password123",
        role: "CUSTOMER",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain(
        "Phone number is mandatory for customer accounts",
      );
    });

    it("should reject registration with duplicate email", async () => {
      const passwordHash = await bcrypt.hash("password123", 10);
      mockDbUsers.push({
        id: "existing-1",
        name: "Existing User",
        email: "alice@example.com",
        phone: "+9999999999",
        passwordHash,
        role: "CUSTOMER",
        status: "ACTIVE",
      });

      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Duplicate Alice",
        email: "alice@example.com",
        phone: "+1234567890",
        password: "password123",
        role: "CUSTOMER",
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("already exists");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should successfully log in user with correct credentials", async () => {
      const passwordHash = await bcrypt.hash("secretpass", 10);
      const user = {
        id: "user-login-1",
        name: "User Login",
        email: "login@example.com",
        phone: "+111222333",
        passwordHash,
        role: "CUSTOMER",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: "cust-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        worker: null,
        business: null,
      };
      mockDbUsers.push(user);

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "login@example.com",
        password: "secretpass",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe("login@example.com");
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it("should fail login with invalid password (401 Unauthorized)", async () => {
      const passwordHash = await bcrypt.hash("secretpass", 10);
      mockDbUsers.push({
        id: "user-login-2",
        name: "User Login",
        email: "login@example.com",
        phone: "+111222333",
        passwordHash,
        role: "CUSTOMER",
        status: "ACTIVE",
      });

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "login@example.com",
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Invalid email/phone or password");
    });

    it("should fail login when user account is suspended (403 Forbidden)", async () => {
      const passwordHash = await bcrypt.hash("secretpass", 10);
      mockDbUsers.push({
        id: "user-suspended",
        name: "Suspended User",
        email: "suspended@example.com",
        phone: "+999111222",
        passwordHash,
        role: "CUSTOMER",
        status: "SUSPENDED",
      });

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "suspended@example.com",
        password: "secretpass",
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("suspended");
    });
  });

  describe("POST /api/v1/auth/refresh-token", () => {
    it("should issue a new access token when provided a valid refresh token", async () => {
      const user = {
        id: "refresh-user-1",
        name: "Refresh User",
        email: "refresh@example.com",
        phone: "+555555555",
        passwordHash: "hash",
        role: "CUSTOMER",
        status: "ACTIVE",
      };
      mockDbUsers.push(user);

      const refreshToken = jwt.sign(
        { id: user.id, role: user.role },
        env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" },
      );

      const res = await request(app)
        .post("/api/v1/auth/refresh-token")
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it("should return 401 Unauthorized for malformed/invalid refresh token", async () => {
      const res = await request(app)
        .post("/api/v1/auth/refresh-token")
        .send({ refreshToken: "invalid-token-string" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("should return profile details for authenticated user", async () => {
      const user = {
        id: "me-user-id",
        name: "Me User",
        email: "me@example.com",
        phone: "+123123123",
        passwordHash: "hash",
        telegramId: null,
        telegramUsername: null,
        role: "CUSTOMER",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: { id: "c-1", createdAt: new Date(), updatedAt: new Date() },
        worker: null,
        business: null,
      };
      mockDbUsers.push(user);

      const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
        expiresIn: "15m",
      });

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe("me-user-id");
      expect(res.body.data.email).toBe("me@example.com");
    });

    it("should return 401 Unauthorized if Authorization header is missing", async () => {
      const res = await request(app).get("/api/v1/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/auth/admin-only-sample (RBAC Test)", () => {
    it("should allow access for user with ADMIN role (200 OK)", async () => {
      const adminToken = jwt.sign(
        { id: "admin-1", role: "ADMIN" },
        env.JWT_SECRET,
        { expiresIn: "15m" },
      );

      const res = await request(app)
        .get("/api/v1/auth/admin-only-sample")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain("Welcome Admin");
    });

    it("should deny access for user with CUSTOMER role (403 Forbidden)", async () => {
      const customerToken = jwt.sign(
        { id: "cust-1", role: "CUSTOMER" },
        env.JWT_SECRET,
        { expiresIn: "15m" },
      );

      const res = await request(app)
        .get("/api/v1/auth/admin-only-sample")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("forbidden");
    });
  });
});

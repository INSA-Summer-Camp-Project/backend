import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindUnique = vi.fn();
const mockUserCreate = vi.fn();
const mockCustomerCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
    },
    $transaction: mockTransaction,
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(() => "mock-jwt"),
  },
}));

vi.mock("@/config/env", () => ({
  env: {
    JWT_SECRET: "test-secret",
    JWT_REFRESH_SECRET: "refresh-secret",
    JWT_ACCESS_EXPIRES_IN: "15m",
    JWT_REFRESH_EXPIRES_IN: "7d",
  },
}));

import { loginWithTelegram } from "@/services/auth.service";

describe("auth.service - Telegram authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a new customer for a first-time Telegram user", async () => {
    const createdUser = {
      id: "user-123",
      name: "Bella",
      email: null,
      phone: null,
      telegramId: "telegram-123",
      telegramUsername: "bella",
      role: "CUSTOMER",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: {
        id: "customer-123",
      },
      worker: null,
      business: null,
    };

    mockFindUnique.mockResolvedValueOnce(null);

    mockTransaction.mockImplementation(async (callback) => {
      const tx = {
        user: {
          create: mockUserCreate,
          findUnique: vi.fn().mockResolvedValue(createdUser),
        },
        customer: {
          create: mockCustomerCreate,
        },
      };

      return callback(tx);
    });

    const result = await loginWithTelegram({
      sub: "telegram-123",
      name: "Bella",
      preferred_username: "bella",
    });

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: {
        telegramId: "telegram-123",
      },
      select: expect.any(Object),
    });

    expect(mockUserCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Bella",
        telegramId: "telegram-123",
        telegramUsername: "bella",
        passwordHash: null,
        role: "CUSTOMER",
        status: "ACTIVE",
      }),
    });

    expect(mockCustomerCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
      },
    });

    expect(result.user).toEqual(createdUser);

    expect(result.tokens.accessToken).toBe("mock-jwt");

    expect(result.tokens.refreshToken).toBe("mock-jwt");
  });

  it("should log in an existing Telegram user", async () => {
    const existingUser = {
      id: "user-123",
      name: "Bella",
      email: null,
      phone: null,
      telegramId: "telegram-123",
      telegramUsername: "bella",
      role: "CUSTOMER",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: {
        id: "customer-123",
      },
      worker: null,
      business: null,
    };

    mockFindUnique.mockResolvedValue(existingUser);

    const result = await loginWithTelegram({
      sub: "telegram-123",
      name: "Bella",
    });

    expect(mockTransaction).not.toHaveBeenCalled();

    expect(result.user).toEqual(existingUser);

    expect(result.tokens.accessToken).toBe("mock-jwt");
  });

  it("should reject an inactive Telegram user", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-123",
      name: "Bella",
      telegramId: "telegram-123",
      role: "CUSTOMER",
      status: "SUSPENDED",
      customer: null,
      worker: null,
      business: null,
    });

    await expect(
      loginWithTelegram({
        sub: "telegram-123",
      }),
    ).rejects.toThrow("Account is suspended");
  });

  it("should use username when Telegram name is missing", async () => {
    const createdUser = {
      id: "user-123",
      name: "bella",
      email: null,
      phone: null,
      telegramId: "telegram-123",
      telegramUsername: "bella",
      role: "CUSTOMER",
      status: "ACTIVE",
      customer: {
        id: "customer-123",
      },
      worker: null,
      business: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockFindUnique.mockResolvedValueOnce(null);

    mockTransaction.mockImplementation(async (callback) => {
      const tx = {
        user: {
          create: mockUserCreate,
          findUnique: vi.fn().mockResolvedValue(createdUser),
        },
        customer: {
          create: mockCustomerCreate,
        },
      };

      return callback(tx);
    });

    await loginWithTelegram({
      sub: "telegram-123",
      preferred_username: "bella",
    });

    expect(mockUserCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "bella",
      }),
    });
  });
});

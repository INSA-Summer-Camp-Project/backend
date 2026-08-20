import { ActiveRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn() },
  workerService: { deleteMany: vi.fn(), createMany: vi.fn() },
  workerProfile: { update: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/middlewares/active-role.middleware", () => ({
  invalidateActiveRoleCache: vi.fn(),
}));

import * as onboardingService from "@/services/onboarding.service";

describe("Onboarding Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return callback(mockPrisma);
    });
  });

  describe("getOnboardingStatus", () => {
    it("should return onboarding status for new user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        lastActiveRole: null,
        customerProfile: { id: "cust-1", bio: null },
        workerProfile: { id: "worker-1", bio: "", experience: "" },
      });

      const result = await onboardingService.getOnboardingStatus("user-1");

      expect(result.hasCompletedOnboarding).toBe(false);
      expect(result.activeRole).toBeNull();
    });

    it("should return onboarding status for completed user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        lastActiveRole: ActiveRole.CUSTOMER,
        customerProfile: { id: "cust-1", bio: null },
        workerProfile: { id: "worker-1", bio: "", experience: "" },
      });

      const result = await onboardingService.getOnboardingStatus("user-1");

      expect(result.hasCompletedOnboarding).toBe(true);
      expect(result.activeRole).toBe(ActiveRole.CUSTOMER);
    });

    it("should throw if user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        onboardingService.getOnboardingStatus("nonexistent"),
      ).rejects.toThrow("User not found");
    });
  });

  describe("completeOnboarding", () => {
    it("should set active role for new user", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          id: "user-1",
          lastActiveRole: null,
          customerProfile: { id: "cust-1" },
          workerProfile: { id: "worker-1" },
        })
        .mockResolvedValueOnce({
          id: "user-1",
          name: "Test User",
          lastActiveRole: ActiveRole.CUSTOMER,
        });

      mockPrisma.user.update.mockResolvedValue({});

      const result = await onboardingService.completeOnboarding("user-1", {
        activeRole: ActiveRole.CUSTOMER,
      });

      expect(result).toBeDefined();
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it("should skip if already onboarded", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        lastActiveRole: ActiveRole.CUSTOMER,
        customerProfile: { id: "cust-1" },
        workerProfile: { id: "worker-1" },
      });

      const result = await onboardingService.completeOnboarding("user-1", {
        activeRole: ActiveRole.WORKER,
      });

      expect(result).toBeDefined();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should update worker profile with bio and experience", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          id: "user-1",
          lastActiveRole: null,
          customerProfile: { id: "cust-1" },
          workerProfile: { id: "worker-1" },
        })
        .mockResolvedValueOnce({
          id: "user-1",
          name: "Test User",
          lastActiveRole: ActiveRole.WORKER,
        });

      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.workerProfile.update.mockResolvedValue({});

      await onboardingService.completeOnboarding("user-1", {
        activeRole: ActiveRole.WORKER,
        bio: "I am a worker",
        experience: "5 years",
      });

      expect(mockPrisma.workerProfile.update).toHaveBeenCalledWith({
        where: { id: "worker-1" },
        data: { bio: "I am a worker", experience: "5 years" },
      });
    });

    it("should update worker categories", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          id: "user-1",
          lastActiveRole: null,
          customerProfile: { id: "cust-1" },
          workerProfile: { id: "worker-1" },
        })
        .mockResolvedValueOnce({
          id: "user-1",
          name: "Test User",
          lastActiveRole: ActiveRole.WORKER,
        });

      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.workerService.deleteMany.mockResolvedValue({});
      mockPrisma.workerService.createMany.mockResolvedValue({});

      await onboardingService.completeOnboarding("user-1", {
        activeRole: ActiveRole.WORKER,
        categoryIds: ["cat-1", "cat-2"],
      });

      expect(mockPrisma.workerService.deleteMany).toHaveBeenCalledWith({
        where: { workerProfileId: "worker-1" },
      });
      expect(mockPrisma.workerService.createMany).toHaveBeenCalledWith({
        data: [
          { workerProfileId: "worker-1", categoryId: "cat-1" },
          { workerProfileId: "worker-1", categoryId: "cat-2" },
        ],
      });
    });

    it("should throw if user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        onboardingService.completeOnboarding("nonexistent", {
          activeRole: ActiveRole.CUSTOMER,
        }),
      ).rejects.toThrow("User not found");
    });
  });
});

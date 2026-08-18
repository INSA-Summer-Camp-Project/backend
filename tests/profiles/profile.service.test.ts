import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";
import * as profileService from "@/services/profile.service";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    workerProfile: { findUnique: vi.fn(), update: vi.fn() },
    workerService: { deleteMany: vi.fn(), createMany: vi.fn() },
    portfolioItem: { create: vi.fn() },
    certificate: { create: vi.fn() },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe("Profile Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateWorkerProfile", () => {
    it("should throw if worker profile not found", async () => {
      vi.mocked(prisma.workerProfile.findUnique).mockResolvedValue(null);

      await expect(
        profileService.updateWorkerProfile("user-1", { bio: "new bio" }),
      ).rejects.toThrow("Worker profile not found");
    });

    it("should update profile fields and categories in transaction", async () => {
      vi.mocked(prisma.workerProfile.findUnique).mockResolvedValue({
        id: "worker-1",
      } as never);
      vi.mocked(prisma.workerProfile.update).mockResolvedValue({
        id: "worker-1",
      } as never);

      // We mock the inner transaction findUnique to return the successfully updated object
      vi.mocked(prisma.workerProfile.findUnique)
        .mockResolvedValueOnce({ id: "worker-1" } as never)
        .mockResolvedValueOnce({ id: "worker-1", bio: "new bio" } as never);

      const result = await profileService.updateWorkerProfile("user-1", {
        bio: "new bio",
        experience: "5 years",
        baseRate: 50,
        categoryIds: ["cat-1", "cat-2"],
      });

      expect(prisma.workerProfile.update).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        data: { bio: "new bio", experience: "5 years", baseRate: 50 },
      });

      expect(prisma.workerService.deleteMany).toHaveBeenCalledWith({
        where: { workerProfileId: "worker-1" },
      });

      expect(prisma.workerService.createMany).toHaveBeenCalledWith({
        data: [
          { workerProfileId: "worker-1", categoryId: "cat-1" },
          { workerProfileId: "worker-1", categoryId: "cat-2" },
        ],
      });

      expect(result).toBeDefined();
    });

    it("should skip category updates if categoryIds is undefined", async () => {
      // Mock the first findUnique (existence check) and the second findUnique (result fetch inside tx)
      vi.mocked(prisma.workerProfile.findUnique)
        .mockResolvedValueOnce({ id: "worker-1" } as never)
        .mockResolvedValueOnce({ id: "worker-1", bio: "new bio" } as never);

      await profileService.updateWorkerProfile("user-1", { bio: "new bio" });

      expect(prisma.workerProfile.update).toHaveBeenCalled();
      expect(prisma.workerService.deleteMany).not.toHaveBeenCalled();
      expect(prisma.workerService.createMany).not.toHaveBeenCalled();
    });
  });

  describe("addPortfolioItem", () => {
    it("should add portfolio item", async () => {
      vi.mocked(prisma.workerProfile.findUnique).mockResolvedValue({
        id: "worker-1",
      } as never);
      vi.mocked(prisma.portfolioItem.create).mockResolvedValue({
        id: "item-1",
      } as never);

      const result = await profileService.addPortfolioItem("user-1", {
        title: "Project",
        description: "Cool project",
        imageUrl: "url",
        imagePublicId: "id",
      });

      expect(prisma.portfolioItem.create).toHaveBeenCalledWith({
        data: {
          workerId: "worker-1",
          title: "Project",
          description: "Cool project",
          imageUrl: "url",
          imagePublicId: "id",
        },
      });
      expect(result.id).toBe("item-1");
    });
  });
});

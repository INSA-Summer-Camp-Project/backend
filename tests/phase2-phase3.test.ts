import { describe, it, expect } from "vitest";
import {
  CreateWorkerProfileDtoSchema,
  CreatePortfolioItemDtoSchema,
  CreateCertificateDtoSchema,
} from "@/dtos/profile.dto";
import { WorkerQueryDtoSchema } from "@/dtos/worker.dto";

describe("Phase 2 & Phase 3 DTO Validation Test Suite", () => {
  it("should validate a valid CreateWorkerProfileDto", () => {
    const validData = {
      bio: "Professional electrician with over 5 years of experience in residential wiring.",
      experience: "5 years",
      baseRate: "350.00",
      categoryIds: ["123e4567-e89b-12d3-a456-426614174000"],
    };
    const result = CreateWorkerProfileDtoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject short bio in CreateWorkerProfileDto", () => {
    const invalidData = {
      bio: "Too short",
      experience: "5 years",
      categoryIds: ["123e4567-e89b-12d3-a456-426614174000"],
    };
    const result = CreateWorkerProfileDtoSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID category ID", () => {
    const invalidData = {
      bio: "Professional electrician with over 5 years of experience in residential wiring.",
      experience: "5 years",
      categoryIds: ["not-a-uuid"],
    };
    const result = CreateWorkerProfileDtoSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should parse valid WorkerQueryDto defaults", () => {
    const result = WorkerQueryDtoSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("should validate WorkerQueryDto with categoryId and custom pagination", () => {
    const query = {
      categoryId: "123e4567-e89b-12d3-a456-426614174000",
      page: "2",
      limit: "10",
    };
    const result = WorkerQueryDtoSchema.safeParse(query);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.categoryId).toBe(
        "123e4567-e89b-12d3-a456-426614174000",
      );
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    }
  });

  it("should validate portfolio item DTO", () => {
    const portfolio = {
      title: "Kitchen Rewiring",
      description: "Complete rewiring for modern kitchen appliances.",
      imageUrl: "https://example.com/image.jpg",
      imagePublicId: "portfolio_123",
    };
    const result = CreatePortfolioItemDtoSchema.safeParse(portfolio);
    expect(result.success).toBe(true);
  });

  it("should validate certificate DTO", () => {
    const cert = {
      title: "Certified Electrician License",
      fileUrl: "https://example.com/cert.pdf",
      filePublicId: "cert_123",
    };
    const result = CreateCertificateDtoSchema.safeParse(cert);
    expect(result.success).toBe(true);
  });
});

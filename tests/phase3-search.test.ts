import { describe, it, expect } from "vitest";
import { WorkerQueryDtoSchema } from "@/dtos/worker.dto";

describe("Phase 3 Customer Search & Filter Test Suite", () => {
  it("should validate a valid search query with keyword, rating, and price filters", () => {
    const query = {
      search: "electrician",
      minRating: "4.5",
      minRate: "150",
      maxRate: "500",
      sortBy: "rating",
      page: "1",
      limit: "10",
    };

    const result = WorkerQueryDtoSchema.safeParse(query);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.search).toBe("electrician");
      expect(result.data.minRating).toBe(4.5);
      expect(result.data.minRate).toBe(150);
      expect(result.data.maxRate).toBe(500);
      expect(result.data.sortBy).toBe("rating");
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    }
  });

  it("should parse default sortBy as 'rating' when omitted", () => {
    const query = {};
    const result = WorkerQueryDtoSchema.safeParse(query);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortBy).toBe("rating");
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("should validate all allowed sortBy enum values", () => {
    const sortOptions = [
      "rating",
      "jobs",
      "newest",
      "rate_asc",
      "rate_desc",
    ] as const;

    sortOptions.forEach((sortBy) => {
      const result = WorkerQueryDtoSchema.safeParse({ sortBy });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortBy).toBe(sortBy);
      }
    });
  });

  it("should reject invalid sortBy enum value", () => {
    const query = { sortBy: "invalid_sort_option" };
    const result = WorkerQueryDtoSchema.safeParse(query);
    expect(result.success).toBe(false);
  });

  it("should reject minRating greater than 5.0", () => {
    const query = { minRating: "5.5" };
    const result = WorkerQueryDtoSchema.safeParse(query);
    expect(result.success).toBe(false);
  });

  it("should reject negative minRate value", () => {
    const query = { minRate: "-50" };
    const result = WorkerQueryDtoSchema.safeParse(query);
    expect(result.success).toBe(false);
  });

  it("should validate a valid UUID categoryId filter", () => {
    const query = { categoryId: "123e4567-e89b-12d3-a456-426614174000" };
    const result = WorkerQueryDtoSchema.safeParse(query);
    expect(result.success).toBe(true);
  });
});

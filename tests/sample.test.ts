import { describe, it, expect } from "vitest";
import { addNumbers, getAppName } from "@/app";

describe("Backend Sample Test Suite", () => {
  it("should calculate sum of numbers using alias import", () => {
    expect(addNumbers(2, 3)).toBe(5);
  });

  it("should return app name using alias import", () => {
    expect(getAppName()).toBe("ServiceHub Backend API");
  });
});

import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "@/app";

describe("Health Check API", () => {
  it("should return UP status on GET /api/health", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("UP");
    expect(response.body.data.service).toBe("ServiceHub Backend API");
  });

  it("should return 404 for unknown routes", async () => {
    const response = await request(app).get("/unknown-route");
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});

// =============================================================================
// GET /api/health — Health check endpoint
// =============================================================================

import { prisma } from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET() {
  try {
    // Test DB connection
    await prisma.$queryRaw`SELECT 1`;

    return apiResponse({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.1.0",
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return apiError("Database connection failed", 503);
  }
}

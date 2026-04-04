// =============================================================================
// Prisma Client — Singleton pattern for Next.js
// =============================================================================
// In development, Next.js hot-reloading would create multiple Prisma instances.
// This pattern ensures a single instance across hot reloads.
// In production (serverless), each function invocation gets its own instance
// but Neon's connection pooler handles the connection management.
// =============================================================================

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

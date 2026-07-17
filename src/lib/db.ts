// Thin Prisma client wrapper. Not wired into the demo page yet (that
// page runs on mockData.ts so the frontend track isn't blocked on the
// database being migrated) — the backend track's next step is to swap
// mockData for real queries through this client.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

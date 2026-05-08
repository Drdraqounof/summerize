import { PrismaPg } from "@prisma/adapter-pg";
import * as PrismaPkg from "@prisma/client";

// Some Prisma client distributions / adapters can change the export shape.
// Load the runtime export defensively and fall back to any available export.
const PrismaClient: any = (PrismaPkg as any).PrismaClient ?? (PrismaPkg as any).default ?? (PrismaPkg as any);

const globalForPrisma = globalThis as unknown as {
  prisma?: any;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({ connectionString });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
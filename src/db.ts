import { PrismaClient } from "@prisma/client";
import { config } from "./config.js";

// Create a singleton Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.nodeEnv === "development" 
      ? ["query", "error", "warn"] 
      : ["error"],
  });

if (config.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handler
export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;


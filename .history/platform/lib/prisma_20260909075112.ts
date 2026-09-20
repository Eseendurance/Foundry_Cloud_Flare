import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  process?: {
    env?: {
      NODE_ENV?: string;
    };
  };
};

const nodeEnv = globalForPrisma.process?.env?.NODE_ENV;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: nodeEnv === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (nodeEnv !== "production") globalForPrisma.prisma = prisma;
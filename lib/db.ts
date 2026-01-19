const createPrismaClient = () => {
  // Avoid static import to prevent build errors when client isn't generated yet.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require("@prisma/client");
  return new PrismaClient();
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

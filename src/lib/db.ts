import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function buildSsl(connectionString: string) {
  const needsSsl = /sslmode=(require|verify-ca|verify-full|prefer)/.test(connectionString);
  if (!needsSsl) return undefined;

  if (process.env.DATABASE_CA_CERT) {
    return { ca: process.env.DATABASE_CA_CERT, rejectUnauthorized: true };
  }

  return { rejectUnauthorized: false };
}

function buildClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL no está seteado. Copia .env.example a .env.local y configura la conexión.",
    );
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString, ssl: buildSsl(connectionString) }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof buildClient> };

export const prisma = globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

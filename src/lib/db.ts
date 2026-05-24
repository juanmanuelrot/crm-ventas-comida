import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const PERMISSIVE_SSL_MODES = new Set(["require", "verify-ca", "verify-full", "prefer"]);

function buildAdapterConfig(raw: string) {
  if (process.env.DATABASE_CA_CERT) {
    const url = new URL(raw);
    url.searchParams.delete("sslmode");
    return {
      connectionString: url.toString(),
      ssl: { ca: process.env.DATABASE_CA_CERT, rejectUnauthorized: true },
    };
  }

  try {
    const url = new URL(raw);
    const sslmode = url.searchParams.get("sslmode");
    if (sslmode && PERMISSIVE_SSL_MODES.has(sslmode)) {
      url.searchParams.set("sslmode", "no-verify");
    }
    return { connectionString: url.toString() };
  } catch {
    return { connectionString: raw };
  }
}

function buildClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL no está seteado. Copia .env.example a .env.local y configura la conexión.",
    );
  }
  return new PrismaClient({
    adapter: new PrismaPg(buildAdapterConfig(connectionString)),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof buildClient> };

export const prisma = globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

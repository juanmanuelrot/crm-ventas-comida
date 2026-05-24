import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

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

const prisma = new PrismaClient({
  adapter: new PrismaPg(buildAdapterConfig(connectionString)),
});

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL y ADMIN_PASSWORD son requeridos para seedear.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { name, role: "ADMIN", disabled: false },
    create: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: "ADMIN",
    },
  });

  console.log(`Admin listo: ${user.email} (${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

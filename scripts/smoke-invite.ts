import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { generateRawToken, hashToken, inviteExpiry } from "../src/lib/invites";

const url = process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) throw new Error("No admin in DB. Run npm run db:seed first.");

  const raw = generateRawToken();
  const invite = await prisma.invite.create({
    data: {
      tokenHash: hashToken(raw),
      type: "INVITE",
      name: "Vendedor Test",
      email: "vendedor.test@example.com",
      invitedById: admin.id,
      expiresAt: inviteExpiry("INVITE"),
    },
  });
  console.log(JSON.stringify({ ok: true, inviteId: invite.id, rawToken: raw }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

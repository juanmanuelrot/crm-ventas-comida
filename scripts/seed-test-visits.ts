import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const url = process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const COMPANIES = [
  { empresa: "Veterinaria San Roque", contacto: "Pablo Méndez · 099 555 444", zona: "Pocitos" },
  { empresa: "Pet Shop El Refugio", contacto: "Cecilia Pérez · 098 222 111", zona: "Cordón" },
  { empresa: "Vetcenter Carrasco", contacto: "Lucía Rivero · 091 333 888", zona: "Carrasco" },
  { empresa: "Distribuidora Lupo", contacto: "Hernán Suárez · 094 777 222", zona: "Centro" },
  { empresa: "Mascotas Felices", contacto: "Sofía Caro · 099 100 200", zona: "Punta Carretas" },
  { empresa: "Petland Buceo", contacto: "Juan Pintos · 095 414 215", zona: "Buceo" },
  { empresa: "Veterinaria del Prado", contacto: "Mariana López · 098 818 020", zona: "Prado" },
  { empresa: "Animal Center", contacto: "Diego Cardozo · 096 717 213", zona: "Malvín" },
  { empresa: "Vet24 Maroñas", contacto: "Tatiana Pereyra · 099 320 110", zona: "Maroñas" },
];

function score(p: number, i: number, f: number) {
  return p + i + f;
}

async function main() {
  const vendor = await prisma.user.findFirst({ where: { role: "VENDEDOR" } });
  if (!vendor) throw new Error("No vendor found. Accept an invite first.");

  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = (day + 6) % 7;
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const created: string[] = [];

  for (let i = 0; i < COMPANIES.length; i += 1) {
    const c = COMPANIES[i];
    const dayOffset = i % 7;
    const hour = 9 + (i % 6);
    const scheduledAt = new Date(startOfWeek);
    scheduledAt.setDate(scheduledAt.getDate() + dayOffset);
    scheduledAt.setHours(hour, (i * 13) % 60, 0, 0);

    const potencial = (i % 3) + 1;
    const interes = ((i + 1) % 3) + 1;
    const facilidad = ((i + 2) % 3) + 1;

    let status: "PENDIENTE" | "REALIZADA" | "CANCELADA" = "PENDIENTE";
    let resultadoVenta: "VENDIDA" | "NO_VENDIDA" | "SEGUIMIENTO" | null = null;
    let completedAt: Date | null = null;
    let cancelledAt: Date | null = null;
    if (i % 4 === 0) {
      status = "REALIZADA";
      resultadoVenta = i % 8 === 0 ? "VENDIDA" : "SEGUIMIENTO";
      completedAt = scheduledAt;
    } else if (i % 5 === 0) {
      status = "CANCELADA";
      cancelledAt = scheduledAt;
    }

    const v = await prisma.visit.create({
      data: {
        vendorId: vendor.id,
        empresa: c.empresa,
        contacto: c.contacto,
        zona: c.zona,
        scheduledAt,
        potencial,
        interes,
        facilidad,
        score: score(potencial, interes, facilidad),
        notasIniciales: `Local en ${c.zona}. Maneja unas ${50 + i * 17} bolsas/mes. Interés en alternativa nacional.`,
        status,
        resultadoVenta,
        completedAt,
        cancelledAt,
        lastEditedById: vendor.id,
      },
    });
    created.push(v.id);
  }

  console.log(`Created ${created.length} visits for vendor ${vendor.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

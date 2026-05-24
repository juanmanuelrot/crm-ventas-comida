import { prisma } from "@/lib/db";
import { startOfWeekInTz, addDays } from "@/lib/tz";

type VisitStatus = "PENDIENTE" | "REALIZADA" | "CANCELADA";

const STATUSES: VisitStatus[] = ["PENDIENTE", "REALIZADA", "CANCELADA"];

function emptyStatusMap(): Record<VisitStatus, number> {
  return { PENDIENTE: 0, REALIZADA: 0, CANCELADA: 0 };
}

function startOfMonth(d: Date): Date {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function vendorMetrics(vendorId: string) {
  const now = new Date();
  const weekStart = startOfWeekInTz(now);
  const weekEnd = addDays(weekStart, 7);
  const monthStart = startOfMonth(now);
  const monthEnd = (() => {
    const x = new Date(monthStart);
    x.setMonth(x.getMonth() + 1);
    return x;
  })();

  const baseWhere = { vendorId, deletedAt: null };

  const [weekGroups, monthGroups, totalGroups, avgAgg, realizadas, vendidas] = await Promise.all([
    prisma.visit.groupBy({
      by: ["status"],
      where: { ...baseWhere, scheduledAt: { gte: weekStart, lt: weekEnd } },
      _count: { _all: true },
    }),
    prisma.visit.groupBy({
      by: ["status"],
      where: { ...baseWhere, scheduledAt: { gte: monthStart, lt: monthEnd } },
      _count: { _all: true },
    }),
    prisma.visit.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: { _all: true },
    }),
    prisma.visit.aggregate({
      where: baseWhere,
      _avg: { score: true },
    }),
    prisma.visit.count({
      where: { ...baseWhere, status: "REALIZADA", resultadoVenta: { not: null } },
    }),
    prisma.visit.count({
      where: { ...baseWhere, status: "REALIZADA", resultadoVenta: "VENDIDA" },
    }),
  ]);

  return {
    week: groupsToMap(weekGroups),
    month: groupsToMap(monthGroups),
    total: groupsToMap(totalGroups),
    avgScore: avgAgg._avg.score ?? null,
    realizadasConResultado: realizadas,
    vendidas,
    conversionRate: realizadas > 0 ? vendidas / realizadas : null,
  };
}

export async function adminOverview() {
  const now = new Date();
  const weekStart = startOfWeekInTz(now);
  const weekEnd = addDays(weekStart, 7);

  const [totalsAll, totalsWeek, vendorRanking, vendidas, realizadasConResultado] = await Promise.all([
    prisma.visit.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.visit.groupBy({
      by: ["status"],
      where: { deletedAt: null, scheduledAt: { gte: weekStart, lt: weekEnd } },
      _count: { _all: true },
    }),
    prisma.visit.groupBy({
      by: ["vendorId"],
      where: { deletedAt: null, status: "REALIZADA" },
      _count: { _all: true },
      orderBy: { _count: { vendorId: "desc" } },
      take: 10,
    }),
    prisma.visit.count({
      where: { deletedAt: null, status: "REALIZADA", resultadoVenta: "VENDIDA" },
    }),
    prisma.visit.count({
      where: { deletedAt: null, status: "REALIZADA", resultadoVenta: { not: null } },
    }),
  ]);

  const vendorIds = vendorRanking.map((r) => r.vendorId);
  const vendors =
    vendorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: vendorIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const vendorMap = new Map(vendors.map((v) => [v.id, v]));

  return {
    totalsAll: groupsToMap(totalsAll),
    totalsWeek: groupsToMap(totalsWeek),
    ranking: vendorRanking.map((r) => ({
      vendorId: r.vendorId,
      name: vendorMap.get(r.vendorId)?.name ?? "(eliminado)",
      email: vendorMap.get(r.vendorId)?.email ?? "",
      realizadas: r._count._all,
    })),
    conversionRate: realizadasConResultado > 0 ? vendidas / realizadasConResultado : null,
    vendidas,
    realizadasConResultado,
  };
}

export async function weeklyTrend(weeks = 8) {
  const now = new Date();
  const currentWeekStart = startOfWeekInTz(now);
  const start = addDays(currentWeekStart, -(weeks - 1) * 7);

  const visits = await prisma.visit.findMany({
    where: { deletedAt: null, scheduledAt: { gte: start } },
    select: { scheduledAt: true, status: true },
  });

  const buckets: Array<{ weekStart: Date; total: number; realizadas: number; canceladas: number }> = [];
  for (let i = 0; i < weeks; i += 1) {
    const ws = addDays(currentWeekStart, -(weeks - 1 - i) * 7);
    buckets.push({ weekStart: ws, total: 0, realizadas: 0, canceladas: 0 });
  }

  for (const v of visits) {
    const idx = Math.floor((v.scheduledAt.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (idx < 0 || idx >= buckets.length) continue;
    buckets[idx].total += 1;
    if (v.status === "REALIZADA") buckets[idx].realizadas += 1;
    if (v.status === "CANCELADA") buckets[idx].canceladas += 1;
  }
  return buckets;
}

function groupsToMap(
  groups: Array<{ status: VisitStatus; _count: { _all: number } }>,
): Record<VisitStatus, number> {
  const map = emptyStatusMap();
  for (const g of groups) {
    if (STATUSES.includes(g.status)) {
      map[g.status] = g._count._all;
    }
  }
  return map;
}

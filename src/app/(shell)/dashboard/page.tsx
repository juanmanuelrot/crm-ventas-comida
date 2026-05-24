import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDays, formatInTz, startOfWeekInTz } from "@/lib/tz";
import { VisitCard } from "@/components/visit-card";
import { WeekNav } from "@/components/week-nav";

export default async function VendorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");

  const sp = await searchParams;
  const reference = sp.w ? new Date(`${sp.w}T12:00:00`) : new Date();
  const weekStart = startOfWeekInTz(reference);
  const weekEnd = addDays(weekStart, 7);

  const visits = await prisma.visit.findMany({
    where: {
      vendorId: session.user.id,
      deletedAt: null,
      scheduledAt: { gte: weekStart, lt: weekEnd },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const days: { date: Date; visits: typeof visits }[] = [];
  for (let i = 0; i < 7; i += 1) {
    const day = addDays(weekStart, i);
    const next = addDays(day, 1);
    days.push({
      date: day,
      visits: visits.filter((v) => v.scheduledAt >= day && v.scheduledAt < next),
    });
  }

  const weekIso = formatInTz(weekStart, "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Mi semana</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Del {formatInTz(weekStart, "d 'de' MMMM")} al{" "}
            {formatInTz(addDays(weekEnd, -1), "d 'de' MMMM")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WeekNav basePath="/dashboard" weekStartIso={weekIso} />
          <Link href="/visits/new" className={buttonVariants()}>
            + Nueva visita
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {days.map((d) => (
          <section key={d.date.toISOString()} className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-sm font-semibold capitalize tracking-tight text-zinc-900">
                {formatInTz(d.date, "EEEE")}
              </h2>
              <span className="text-xs tabular-nums text-zinc-400">
                {formatInTz(d.date, "d MMM")}
              </span>
            </div>
            {d.visits.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-200 bg-white/50 p-4 text-center text-xs text-zinc-400">
                Sin visitas
              </p>
            ) : (
              <div className="space-y-2">
                {d.visits.map((v) => (
                  <VisitCard key={v.id} visit={v} href={`/visits/${v.id}`} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

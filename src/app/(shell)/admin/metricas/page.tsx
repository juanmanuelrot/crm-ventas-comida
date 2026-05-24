import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { adminOverview, weeklyTrend } from "@/lib/metrics";
import { MetricCard } from "@/components/metric-card";
import { formatInTz } from "@/lib/tz";
import { TrendChart } from "./trend-chart";

function pct(n: number | null) {
  if (n == null) return "—";
  return `${(n * 100).toFixed(0)}%`;
}

export default async function AdminMetricasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [o, trend] = await Promise.all([adminOverview(), weeklyTrend(8)]);

  const data = trend.map((b) => ({
    label: formatInTz(b.weekStart, "d MMM"),
    total: b.total,
    realizadas: b.realizadas,
    canceladas: b.canceladas,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Métricas</h1>
        <p className="mt-1 text-sm text-zinc-500">Estado global del negocio.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard title="Pendientes" value={o.totalsAll.PENDIENTE} />
        <MetricCard title="Realizadas" value={o.totalsAll.REALIZADA} />
        <MetricCard
          title="Conversión"
          value={pct(o.conversionRate)}
          hint={`${o.vendidas} / ${o.realizadasConResultado}`}
        />
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="font-display text-base font-semibold tracking-tight">
            Tendencia
          </h2>
          <p className="text-xs text-zinc-500">Últimas 8 semanas.</p>
        </div>
        <div className="px-3 py-4">
          <TrendChart data={data} />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="font-display text-base font-semibold tracking-tight">
            Ranking de vendedores
          </h2>
          <p className="text-xs text-zinc-500">Por visitas realizadas (top 10).</p>
        </div>
        <div className="px-5 py-4">
          {o.ranking.length === 0 ? (
            <p className="text-sm text-zinc-500">Sin datos todavía.</p>
          ) : (
            <ol className="divide-y divide-zinc-100">
              {o.ranking.map((r, i) => (
                <li
                  key={r.vendorId}
                  className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold tabular-nums text-zinc-700">
                      {i + 1}
                    </span>
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-zinc-500">{r.email}</div>
                    </div>
                  </div>
                  <span className="font-display text-base font-semibold tabular-nums tracking-tight">
                    {r.realizadas}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { vendorMetrics } from "@/lib/metrics";
import { MetricCard } from "@/components/metric-card";

function pct(n: number | null) {
  if (n == null) return "—";
  return `${(n * 100).toFixed(0)}%`;
}

function fmtNum(n: number | null) {
  if (n == null) return "—";
  return n.toFixed(1);
}

export default async function VendorMetricsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin/metricas");

  const m = await vendorMetrics(session.user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Mis métricas</h1>
        <p className="mt-1 text-sm text-zinc-500">Tu actividad y resultados.</p>
      </div>

      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Esta semana
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricCard title="Pendientes" value={m.week.PENDIENTE} />
          <MetricCard title="Realizadas" value={m.week.REALIZADA} />
          <MetricCard title="Canceladas" value={m.week.CANCELADA} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Este mes
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricCard title="Pendientes" value={m.month.PENDIENTE} />
          <MetricCard title="Realizadas" value={m.month.REALIZADA} />
          <MetricCard title="Canceladas" value={m.month.CANCELADA} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Histórico
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricCard
            title="Tasa de conversión"
            value={pct(m.conversionRate)}
            hint={`${m.vendidas} vendidas / ${m.realizadasConResultado} con resultado`}
          />
          <MetricCard title="Score promedio" value={fmtNum(m.avgScore)} />
          <MetricCard
            title="Total visitas"
            value={m.total.PENDIENTE + m.total.REALIZADA + m.total.CANCELADA}
          />
        </div>
      </section>
    </div>
  );
}

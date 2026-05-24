import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatInTz } from "@/lib/tz";
import { ScoreBadge } from "@/components/score-badge";
import { ResultadoBadge, StatusBadge } from "@/components/status-badge";
import { VisitCard } from "@/components/visit-card";

const STATUS_FILTERS = ["TODOS", "PENDIENTE", "REALIZADA", "CANCELADA"] as const;

export default async function AdminVisitasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; vendorId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const sp = await searchParams;
  const status =
    sp.status && STATUS_FILTERS.includes(sp.status as (typeof STATUS_FILTERS)[number])
      ? sp.status
      : "TODOS";
  const vendorId = sp.vendorId || "TODOS";

  const where: Record<string, unknown> = { deletedAt: null };
  if (status !== "TODOS") where.status = status;
  if (vendorId !== "TODOS") where.vendorId = vendorId;

  const [visits, vendors] = await Promise.all([
    prisma.visit.findMany({
      where,
      orderBy: { scheduledAt: "desc" },
      take: 100,
      include: { vendor: { select: { id: true, name: true } } },
    }),
    prisma.user.findMany({
      where: { role: "VENDEDOR" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  function urlFor(updates: Record<string, string>) {
    const params = new URLSearchParams();
    const next = { status, vendorId, ...updates };
    if (next.status !== "TODOS") params.set("status", next.status);
    if (next.vendorId !== "TODOS") params.set("vendorId", next.vendorId);
    const qs = params.toString();
    return `/admin/visitas${qs ? `?${qs}` : ""}`;
  }

  const pillClass = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? "border-zinc-900 bg-zinc-900 text-white"
        : "border-zinc-200 bg-white text-zinc-600 active:border-zinc-300 hover:border-zinc-300"
    }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Visitas</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Mostrando hasta 100 visitas más recientes.
          </p>
        </div>
        <Link href="/admin/visitas/new" className={`${buttonVariants()} w-full sm:w-auto`}>
          + Nueva visita
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Estado
          </span>
          {STATUS_FILTERS.map((s) => (
            <Link key={s} href={urlFor({ status: s })} className={pillClass(status === s)}>
              {s === "TODOS" ? "Todos" : s[0] + s.slice(1).toLowerCase()}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Vendedor
          </span>
          <Link href={urlFor({ vendorId: "TODOS" })} className={pillClass(vendorId === "TODOS")}>
            Todos
          </Link>
          {vendors.map((v) => (
            <Link key={v.id} href={urlFor({ vendorId: v.id })} className={pillClass(vendorId === v.id)}>
              {v.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile: card list */}
      <div className="space-y-2 md:hidden">
        {visits.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500">
            No hay visitas con esos filtros.
          </p>
        ) : (
          visits.map((v) => (
            <VisitCard
              key={v.id}
              visit={{
                id: v.id,
                empresa: v.empresa,
                contacto: v.contacto,
                zona: v.zona,
                scheduledAt: v.scheduledAt,
                score: v.score,
                status: v.status,
                resultadoVenta: v.resultadoVenta,
                vendorName: v.vendor.name,
              }}
              href={`/admin/visitas/${v.id}`}
            />
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-zinc-500">
                    No hay visitas con esos filtros.
                  </TableCell>
                </TableRow>
              ) : (
                visits.map((v) => (
                  <TableRow key={v.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/admin/visitas/${v.id}`} className="block whitespace-nowrap">
                        {formatInTz(v.scheduledAt, "d MMM HH:mm")}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/visitas/${v.id}`} className="block">
                        <div className="font-medium">{v.empresa}</div>
                        <div className="text-xs text-zinc-500">{v.contacto}</div>
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{v.vendor.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{v.zona}</TableCell>
                    <TableCell>
                      <ScoreBadge score={v.score} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge status={v.status} />
                        <ResultadoBadge resultado={v.resultadoVenta} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

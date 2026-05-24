import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatInTz, toInputDate, toInputTime } from "@/lib/tz";
import { ScoreBadge } from "@/components/score-badge";
import { ResultadoBadge, StatusBadge } from "@/components/status-badge";
import { VisitForm } from "@/components/visit-form";
import { ChangeStatusForm } from "@/components/change-status-form";
import { AddNoteForm } from "@/components/add-note-form";
import { softDeleteVisitAction } from "@/lib/actions/visit-actions";

export default async function VisitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const visit = await prisma.visit.findFirst({
    where: { id, deletedAt: null },
    include: {
      vendor: { select: { id: true, name: true } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });
  if (!visit) notFound();

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && visit.vendorId !== session.user.id) notFound();

  const allowed: ("PENDIENTE" | "REALIZADA" | "CANCELADA")[] =
    visit.status === "PENDIENTE"
      ? ["REALIZADA", "CANCELADA"]
      : visit.status === "CANCELADA" && isAdmin
        ? ["PENDIENTE"]
        : [];

  const vendors = isAdmin
    ? await prisma.user.findMany({
        where: { role: "VENDEDOR", disabled: false },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={isAdmin ? "/admin/visitas" : "/dashboard"}
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← Volver
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">
              {visit.empresa}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {visit.contacto} · {visit.zona} ·{" "}
              <span className="capitalize">
                {formatInTz(visit.scheduledAt, "EEEE d 'de' MMMM 'a las' HH:mm")}
              </span>
            </p>
            {isAdmin ? (
              <p className="mt-1 text-xs text-zinc-400">Vendedor: {visit.vendor.name}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={visit.status} />
            <ResultadoBadge resultado={visit.resultadoVenta} />
            <ScoreBadge score={visit.score} />
          </div>
        </div>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="font-display text-base font-semibold tracking-tight">Cambiar estado</h2>
        </div>
        <div className="px-5 py-4">
          <ChangeStatusForm
            visitId={visit.id}
            currentStatus={visit.status as "PENDIENTE" | "REALIZADA" | "CANCELADA"}
            allowed={allowed}
          />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="font-display text-base font-semibold tracking-tight">Notas</h2>
        </div>
        <div className="space-y-4 px-5 py-4">
          <AddNoteForm visitId={visit.id} />

          <div className="rounded-lg bg-zinc-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Notas iniciales
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap">{visit.notasIniciales}</p>
          </div>

          {visit.notes.length > 0 ? (
            <div className="space-y-2">
              {visit.notes.map((n) => (
                <div key={n.id} className="rounded-lg border border-zinc-200 p-3 text-sm">
                  <div className="text-xs text-zinc-500">
                    <span className="font-medium text-zinc-700">{n.author.name}</span> ·{" "}
                    {formatInTz(n.createdAt, "d MMM HH:mm")}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{n.body}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="font-display text-base font-semibold tracking-tight">Editar visita</h2>
        </div>
        <div className="px-5 py-5">
          <VisitForm
            mode="edit"
            initial={{
              id: visit.id,
              empresa: visit.empresa,
              contacto: visit.contacto,
              zona: visit.zona,
              date: toInputDate(visit.scheduledAt),
              time: toInputTime(visit.scheduledAt),
              potencial: visit.potencial,
              interes: visit.interes,
              facilidad: visit.facilidad,
              notasIniciales: visit.notasIniciales,
              vendorId: visit.vendorId,
            }}
            vendors={vendors}
          />
        </div>
      </section>

      <div className="flex items-center justify-between">
        <Link
          href={isAdmin ? "/admin/visitas" : "/dashboard"}
          className={buttonVariants({ variant: "outline" })}
        >
          ← Volver
        </Link>
        <form action={softDeleteVisitAction}>
          <input type="hidden" name="id" value={visit.id} />
          <Button type="submit" variant="destructive" size="sm">
            Eliminar visita
          </Button>
        </form>
      </div>
    </div>
  );
}

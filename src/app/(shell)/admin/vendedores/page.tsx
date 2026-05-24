import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatInTz } from "@/lib/tz";
import { InviteButton } from "@/components/invite-button";
import { ResetPasswordButton } from "@/components/reset-password-button";
import { toggleVendorDisabledAction } from "@/lib/actions/invite-actions";

export default async function AdminVendedoresPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const host = hdrs.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;

  const [vendors, pendingInvites] = await Promise.all([
    prisma.user.findMany({
      where: { role: "VENDEDOR" },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { visits: true } } },
    }),
    prisma.invite.findMany({
      where: { type: "INVITE", usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activos = vendors.filter((v) => !v.disabled).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Vendedores</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gestioná el equipo. Generá links de invite y reset de contraseña.
          </p>
        </div>
        <InviteButton origin={origin} />
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="font-display text-base font-semibold tracking-tight">Equipo activo</h2>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
            {activos} activos · {vendors.length} totales
          </span>
        </div>

        {vendors.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            No hay vendedores todavía. Generá un invite.
          </p>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="divide-y divide-zinc-100 md:hidden">
              {vendors.map((v) => (
                <div key={v.id} className="space-y-2 px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{v.name}</div>
                      <div className="text-xs text-zinc-500">{v.email}</div>
                    </div>
                    {v.disabled ? (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                        Deshabilitado
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                        Activo
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {v._count.visits} visita{v._count.visits === 1 ? "" : "s"}
                  </div>
                  <div className="flex gap-2">
                    <ResetPasswordButton userId={v.id} origin={origin} userName={v.name} />
                    <form action={toggleVendorDisabledAction} className="inline-block">
                      <input type="hidden" name="userId" value={v.id} />
                      <Button type="submit" variant="outline" size="sm">
                        {v.disabled ? "Habilitar" : "Deshabilitar"}
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Visitas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell className="text-zinc-600">{v.email}</TableCell>
                      <TableCell className="tabular-nums">{v._count.visits}</TableCell>
                      <TableCell>
                        {v.disabled ? (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                            Deshabilitado
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                            Activo
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <ResetPasswordButton userId={v.id} origin={origin} userName={v.name} />
                        <form action={toggleVendorDisabledAction} className="inline-block">
                          <input type="hidden" name="userId" value={v.id} />
                          <Button type="submit" variant="outline" size="sm">
                            {v.disabled ? "Habilitar" : "Deshabilitar"}
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="font-display text-base font-semibold tracking-tight">
            Invitaciones pendientes
          </h2>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
            {pendingInvites.length}
          </span>
        </div>
        {pendingInvites.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            Sin invitaciones abiertas.
          </p>
        ) : (
          <>
            <div className="divide-y divide-zinc-100 md:hidden">
              {pendingInvites.map((i) => (
                <div key={i.id} className="px-5 py-3 text-sm">
                  <div className="font-medium">{i.name}</div>
                  <div className="text-xs text-zinc-500">{i.email}</div>
                  <div className="mt-1 flex justify-between text-xs text-zinc-500">
                    <span>Creada: {formatInTz(i.createdAt, "d MMM HH:mm")}</span>
                    <span>Expira: {formatInTz(i.expiresAt, "d MMM HH:mm")}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Creada</TableHead>
                    <TableHead>Expira</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvites.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell className="text-zinc-600">{i.email}</TableCell>
                      <TableCell className="text-zinc-600">
                        {formatInTz(i.createdAt, "d MMM HH:mm")}
                      </TableCell>
                      <TableCell className="text-zinc-600">
                        {formatInTz(i.expiresAt, "d MMM HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

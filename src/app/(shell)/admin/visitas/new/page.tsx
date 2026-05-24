import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toInputDate, toInputTime } from "@/lib/tz";
import { VisitForm } from "@/components/visit-form";

export default async function AdminNewVisitPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const vendors = await prisma.user.findMany({
    where: { role: "VENDEDOR", disabled: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const now = new Date();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Nueva visita</h1>
        <p className="mt-1 text-sm text-zinc-500">Asigná esta visita a un vendedor.</p>
      </div>
      {vendors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center">
          <p className="text-sm text-zinc-500">
            Primero invitá al menos un vendedor en{" "}
            <Link href="/admin/vendedores" className="font-medium text-zinc-900 underline">
              Vendedores
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <VisitForm
            mode="create"
            vendors={vendors}
            initial={{
              empresa: "",
              contacto: "",
              zona: "",
              date: toInputDate(now),
              time: toInputTime(now),
              potencial: 2,
              interes: 2,
              facilidad: 2,
              notasIniciales: "",
              vendorId: vendors[0]?.id,
            }}
          />
        </div>
      )}
    </div>
  );
}

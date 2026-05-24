import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { toInputDate, toInputTime } from "@/lib/tz";
import { VisitForm } from "@/components/visit-form";

export default async function NewVisitPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const now = new Date();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Nueva visita</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Registrá una visita comercial. El score se calcula automáticamente.
        </p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <VisitForm
          mode="create"
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
          }}
        />
      </div>
    </div>
  );
}

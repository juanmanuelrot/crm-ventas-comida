"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeStatusAction, type VisitActionState } from "@/lib/actions/visit-actions";

type StatusOption = "PENDIENTE" | "REALIZADA" | "CANCELADA";
type Resultado = "VENDIDA" | "NO_VENDIDA" | "SEGUIMIENTO";

const STATUS_BUTTON_STYLE: Record<StatusOption, string> = {
  REALIZADA:
    "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 data-[selected=true]:border-emerald-400 data-[selected=true]:bg-emerald-100",
  CANCELADA:
    "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 data-[selected=true]:border-rose-400 data-[selected=true]:bg-rose-100",
  PENDIENTE:
    "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 data-[selected=true]:border-blue-400 data-[selected=true]:bg-blue-100",
};

const STATUS_LABEL: Record<StatusOption, string> = {
  PENDIENTE: "Marcar pendiente",
  REALIZADA: "Marcar realizada",
  CANCELADA: "Cancelar visita",
};

const RESULTADO_OPTIONS: Array<{ value: Resultado; label: string; tone: "green" | "rose" | "amber" }> = [
  { value: "VENDIDA", label: "Vendida", tone: "green" },
  { value: "NO_VENDIDA", label: "No vendida", tone: "rose" },
  { value: "SEGUIMIENTO", label: "Seguimiento", tone: "amber" },
];

const RESULTADO_TONE: Record<"green" | "rose" | "amber", string> = {
  green: "data-[selected=true]:bg-emerald-100 data-[selected=true]:text-emerald-800 data-[selected=true]:ring-2 data-[selected=true]:ring-emerald-300",
  rose: "data-[selected=true]:bg-rose-100 data-[selected=true]:text-rose-800 data-[selected=true]:ring-2 data-[selected=true]:ring-rose-300",
  amber: "data-[selected=true]:bg-amber-100 data-[selected=true]:text-amber-800 data-[selected=true]:ring-2 data-[selected=true]:ring-amber-300",
};

export function ChangeStatusForm({
  visitId,
  currentStatus,
  allowed,
}: {
  visitId: string;
  currentStatus: StatusOption;
  allowed: StatusOption[];
}) {
  const [target, setTarget] = useState<StatusOption | null>(null);
  const [resultado, setResultado] = useState<Resultado>("VENDIDA");
  const [state, formAction, pending] = useActionState<VisitActionState, FormData>(
    changeStatusAction,
    undefined,
  );

  if (allowed.length === 0) {
    return (
      <p className="text-sm text-zinc-500">Esta visita no admite más cambios de estado.</p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={visitId} />
      {target ? <input type="hidden" name="to" value={target} /> : null}
      {target === "REALIZADA" ? (
        <input type="hidden" name="resultadoVenta" value={resultado} />
      ) : null}

      <div>
        <Label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Estado actual: {LABELS[currentStatus]}
        </Label>
        <div className={`mt-1.5 grid gap-2 ${allowed.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {allowed.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTarget(s)}
              data-selected={target === s}
              className={`rounded-lg border px-3 py-3 text-sm font-medium transition-all ${STATUS_BUTTON_STYLE[s]}`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {target === "REALIZADA" ? (
        <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <div>
            <Label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Resultado de la venta
            </Label>
            <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg border border-zinc-200 bg-white p-1">
              {RESULTADO_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setResultado(o.value)}
                  data-selected={resultado === o.value}
                  className={`rounded-md px-2 py-2 text-sm font-medium text-zinc-700 transition-all ${RESULTADO_TONE[o.tone]}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label
              htmlFor="montoEstimado"
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Monto estimado (opcional)
            </Label>
            <Input
              id="montoEstimado"
              name="montoEstimado"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </div>
        </div>
      ) : null}

      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      {target ? (
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Aplicando…" : "Confirmar"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setTarget(null)}>
            Cancelar
          </Button>
        </div>
      ) : null}
    </form>
  );
}

const LABELS: Record<StatusOption, string> = {
  PENDIENTE: "Pendiente",
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
};

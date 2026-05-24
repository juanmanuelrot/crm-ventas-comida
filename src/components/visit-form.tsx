"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScoreSegment } from "@/components/score-segment";
import { ZONAS } from "@/lib/zonas";
import {
  createVisitAction,
  editVisitAction,
  type VisitActionState,
} from "@/lib/actions/visit-actions";

type VendorOption = { id: string; name: string };

type Initial = {
  id?: string;
  empresa: string;
  contacto: string;
  zona: string;
  date: string;
  time: string;
  potencial: number;
  interes: number;
  facilidad: number;
  notasIniciales: string;
  vendorId?: string;
};

const POTENCIAL_OPTIONS = [
  { value: 1, label: "Bajo" },
  { value: 2, label: "Medio" },
  { value: 3, label: "Alto" },
];

const INTERES_OPTIONS = [
  { value: 1, label: "Frío" },
  { value: 2, label: "Tibio" },
  { value: 3, label: "Caliente" },
];

const FACILIDAD_OPTIONS = [
  { value: 1, label: "Difícil" },
  { value: 2, label: "Normal" },
  { value: 3, label: "Fácil" },
];

export function VisitForm({
  mode,
  initial,
  vendors,
}: {
  mode: "create" | "edit";
  initial: Initial;
  vendors?: VendorOption[];
}) {
  const action = mode === "create" ? createVisitAction : editVisitAction;
  const [state, formAction, pending] = useActionState<VisitActionState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-6">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      {vendors ? (
        <div className="space-y-1.5">
          <Label htmlFor="vendorId" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Vendedor
          </Label>
          <Select
            name="vendorId"
            defaultValue={initial.vendorId ?? vendors[0]?.id}
            items={Object.fromEntries(vendors.map((v) => [v.id, v.name]))}
          >
            <SelectTrigger id="vendorId" className="w-full">
              <SelectValue placeholder="Vendedor" />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="empresa" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Empresa
          </Label>
          <Input id="empresa" name="empresa" defaultValue={initial.empresa} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contacto" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Contacto
          </Label>
          <Input id="contacto" name="contacto" defaultValue={initial.contacto} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="zona" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Zona
          </Label>
          <Select
            name="zona"
            defaultValue={initial.zona || undefined}
            items={Object.fromEntries(ZONAS.map((z) => [z, z]))}
          >
            <SelectTrigger id="zona" className="w-full">
              <SelectValue placeholder="Elegí una zona" />
            </SelectTrigger>
            <SelectContent>
              {ZONAS.map((z) => (
                <SelectItem key={z} value={z}>
                  {z}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Día
            </Label>
            <Input id="date" type="date" name="date" defaultValue={initial.date} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="time" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Hora
            </Label>
            <Input id="time" type="time" name="time" defaultValue={initial.time} required />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <ScoreSegment
          name="potencial"
          label="Potencial de compra"
          defaultValue={initial.potencial}
          options={POTENCIAL_OPTIONS}
        />
        <ScoreSegment
          name="interes"
          label="Interés mostrado"
          defaultValue={initial.interes}
          options={INTERES_OPTIONS}
        />
        <ScoreSegment
          name="facilidad"
          label="Facilidad de acceso"
          defaultValue={initial.facilidad}
          options={FACILIDAD_OPTIONS}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notasIniciales" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Notas iniciales
        </Label>
        <Textarea
          id="notasIniciales"
          name="notasIniciales"
          defaultValue={initial.notasIniciales}
          rows={4}
          required
        />
      </div>

      {state?.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : mode === "create" ? "Crear visita" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

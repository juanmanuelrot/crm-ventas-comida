import { Prisma } from "@/generated/prisma/client";

export type VisitStatus = "PENDIENTE" | "REALIZADA" | "CANCELADA";

export function computeScore(potencial: number, interes: number, facilidad: number): number {
  return potencial + interes + facilidad;
}

const ALLOWED_TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
  PENDIENTE: ["REALIZADA", "CANCELADA"],
  REALIZADA: [],
  CANCELADA: ["PENDIENTE"],
};

export function assertTransition(from: VisitStatus, to: VisitStatus): void {
  if (from === to) return;
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new Error(`Transición inválida: ${from} → ${to}`);
  }
}

export function scoreColor(score: number): "red" | "amber" | "green" {
  if (score <= 4) return "red";
  if (score <= 6) return "amber";
  return "green";
}

export function scoreLabel(score: number): string {
  if (score <= 4) return "Bajo";
  if (score <= 6) return "Medio";
  return "Alto";
}

export function getVisitsBaseWhere(extra: Prisma.VisitWhereInput = {}): Prisma.VisitWhereInput {
  return { deletedAt: null, ...extra };
}

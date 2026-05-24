"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { combineDateAndTime } from "@/lib/tz";
import { isValidZona } from "@/lib/zonas";
import { assertTransition, computeScore, type VisitStatus } from "@/lib/visits";

const score = z.coerce.number().int().min(1).max(3);

const visitInputSchema = z.object({
  empresa: z.string().min(2).max(120),
  contacto: z.string().min(2).max(120),
  zona: z.string().refine(isValidZona, { error: "Zona inválida." }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  potencial: score,
  interes: score,
  facilidad: score,
  notasIniciales: z.string().min(1).max(2000),
  vendorId: z.string().optional(),
});

export type VisitActionState = { error?: string } | undefined;

async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function createVisitAction(
  _prev: VisitActionState,
  formData: FormData,
): Promise<VisitActionState> {
  const user = await requireUser();

  const parsed = visitInputSchema.safeParse({
    empresa: formData.get("empresa"),
    contacto: formData.get("contacto"),
    zona: formData.get("zona"),
    date: formData.get("date"),
    time: formData.get("time"),
    potencial: formData.get("potencial"),
    interes: formData.get("interes"),
    facilidad: formData.get("facilidad"),
    notasIniciales: formData.get("notasIniciales"),
    vendorId: formData.get("vendorId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const vendorId =
    user.role === "ADMIN" && parsed.data.vendorId ? parsed.data.vendorId : user.id;

  if (vendorId !== user.id) {
    const vendor = await prisma.user.findUnique({ where: { id: vendorId } });
    if (!vendor) return { error: "Vendedor no encontrado." };
  }

  const scheduledAt = combineDateAndTime(parsed.data.date, parsed.data.time);
  const score = computeScore(parsed.data.potencial, parsed.data.interes, parsed.data.facilidad);

  const created = await prisma.visit.create({
    data: {
      vendorId,
      empresa: parsed.data.empresa.trim(),
      contacto: parsed.data.contacto.trim(),
      zona: parsed.data.zona,
      scheduledAt,
      potencial: parsed.data.potencial,
      interes: parsed.data.interes,
      facilidad: parsed.data.facilidad,
      score,
      notasIniciales: parsed.data.notasIniciales.trim(),
      lastEditedById: user.id,
    },
  });

  revalidatePath("/dashboard");
  if (user.role === "ADMIN") revalidatePath("/admin/visitas");
  redirect(user.role === "ADMIN" ? `/admin/visitas/${created.id}` : `/visits/${created.id}`);
}

const editVisitSchema = visitInputSchema.extend({ id: z.string().min(1) });

export async function editVisitAction(
  _prev: VisitActionState,
  formData: FormData,
): Promise<VisitActionState> {
  const user = await requireUser();

  const parsed = editVisitSchema.safeParse({
    id: formData.get("id"),
    empresa: formData.get("empresa"),
    contacto: formData.get("contacto"),
    zona: formData.get("zona"),
    date: formData.get("date"),
    time: formData.get("time"),
    potencial: formData.get("potencial"),
    interes: formData.get("interes"),
    facilidad: formData.get("facilidad"),
    notasIniciales: formData.get("notasIniciales"),
    vendorId: formData.get("vendorId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const existing = await prisma.visit.findFirst({
    where: { id: parsed.data.id, deletedAt: null },
  });
  if (!existing) return { error: "Visita no encontrada." };

  if (user.role !== "ADMIN" && existing.vendorId !== user.id) {
    return { error: "Sin permiso para editar esta visita." };
  }

  const scheduledAt = combineDateAndTime(parsed.data.date, parsed.data.time);
  const score = computeScore(parsed.data.potencial, parsed.data.interes, parsed.data.facilidad);
  const vendorId =
    user.role === "ADMIN" && parsed.data.vendorId ? parsed.data.vendorId : existing.vendorId;

  await prisma.visit.update({
    where: { id: existing.id },
    data: {
      vendorId,
      empresa: parsed.data.empresa.trim(),
      contacto: parsed.data.contacto.trim(),
      zona: parsed.data.zona,
      scheduledAt,
      potencial: parsed.data.potencial,
      interes: parsed.data.interes,
      facilidad: parsed.data.facilidad,
      score,
      notasIniciales: parsed.data.notasIniciales.trim(),
      lastEditedById: user.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/visits/${existing.id}`);
  if (user.role === "ADMIN") {
    revalidatePath("/admin/visitas");
    revalidatePath(`/admin/visitas/${existing.id}`);
  }
  return undefined;
}

const transitionSchema = z.object({
  id: z.string().min(1),
  to: z.enum(["PENDIENTE", "REALIZADA", "CANCELADA"]),
  resultadoVenta: z.enum(["VENDIDA", "NO_VENDIDA", "SEGUIMIENTO"]).optional(),
  montoEstimado: z.coerce.number().nonnegative().optional(),
});

export async function changeStatusAction(
  _prev: VisitActionState,
  formData: FormData,
): Promise<VisitActionState> {
  const user = await requireUser();

  const parsed = transitionSchema.safeParse({
    id: formData.get("id"),
    to: formData.get("to"),
    resultadoVenta: formData.get("resultadoVenta") || undefined,
    montoEstimado: formData.get("montoEstimado") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const visit = await prisma.visit.findFirst({
    where: { id: parsed.data.id, deletedAt: null },
  });
  if (!visit) return { error: "Visita no encontrada." };

  if (user.role !== "ADMIN" && visit.vendorId !== user.id) {
    return { error: "Sin permiso." };
  }

  try {
    assertTransition(visit.status as VisitStatus, parsed.data.to);
  } catch (e) {
    return { error: (e as Error).message };
  }

  if (parsed.data.to === "REALIZADA" && !parsed.data.resultadoVenta) {
    return { error: "Marcar como realizada requiere un resultado de venta." };
  }

  const data: Record<string, unknown> = {
    status: parsed.data.to,
    lastEditedById: user.id,
  };
  if (parsed.data.to === "REALIZADA") {
    data.completedAt = new Date();
    data.resultadoVenta = parsed.data.resultadoVenta;
    data.montoEstimado = parsed.data.montoEstimado ?? null;
  } else if (parsed.data.to === "CANCELADA") {
    data.cancelledAt = new Date();
  } else if (parsed.data.to === "PENDIENTE") {
    data.cancelledAt = null;
    data.completedAt = null;
    data.resultadoVenta = null;
    data.montoEstimado = null;
  }

  await prisma.visit.update({ where: { id: visit.id }, data });

  revalidatePath("/dashboard");
  revalidatePath(`/visits/${visit.id}`);
  revalidatePath("/admin/visitas");
  revalidatePath(`/admin/visitas/${visit.id}`);
  return undefined;
}

const addNoteSchema = z.object({
  visitId: z.string().min(1),
  body: z.string().min(1).max(2000),
});

export async function addNoteAction(
  _prev: VisitActionState,
  formData: FormData,
): Promise<VisitActionState> {
  const user = await requireUser();

  const parsed = addNoteSchema.safeParse({
    visitId: formData.get("visitId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: "Nota inválida." };
  }

  const visit = await prisma.visit.findFirst({
    where: { id: parsed.data.visitId, deletedAt: null },
  });
  if (!visit) return { error: "Visita no encontrada." };

  if (user.role !== "ADMIN" && visit.vendorId !== user.id) {
    return { error: "Sin permiso." };
  }

  await prisma.visitNote.create({
    data: { visitId: visit.id, authorId: user.id, body: parsed.data.body.trim() },
  });

  revalidatePath(`/visits/${visit.id}`);
  revalidatePath(`/admin/visitas/${visit.id}`);
  return undefined;
}

export async function softDeleteVisitAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const visit = await prisma.visit.findFirst({ where: { id, deletedAt: null } });
  if (!visit) return;

  if (user.role !== "ADMIN" && visit.vendorId !== user.id) return;

  await prisma.visit.update({
    where: { id },
    data: { deletedAt: new Date(), lastEditedById: user.id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/admin/visitas");
  redirect(user.role === "ADMIN" ? "/admin/visitas" : "/dashboard");
}

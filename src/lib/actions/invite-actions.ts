"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateRawToken, hashToken, inviteExpiry } from "@/lib/invites";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session.user;
}

const createInviteSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
});

export type InviteCreateState =
  | { error?: string; token?: undefined }
  | { error?: undefined; token: string; email: string; name: string }
  | undefined;

export async function createInviteAction(
  _prev: InviteCreateState,
  formData: FormData,
): Promise<InviteCreateState> {
  const admin = await requireAdmin();
  const parsed = createInviteSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  });
  if (!parsed.success) {
    return { error: "Nombre y email son requeridos." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "Ya existe un usuario con ese email." };
  }

  const raw = generateRawToken();
  const tokenHash = hashToken(raw);

  await prisma.invite.create({
    data: {
      tokenHash,
      type: "INVITE",
      name: parsed.data.name,
      email: parsed.data.email,
      invitedById: admin.id,
      expiresAt: inviteExpiry("INVITE"),
    },
  });

  revalidatePath("/admin/vendedores");
  return { token: raw, email: parsed.data.email, name: parsed.data.name };
}

export type ResetState = { error?: string; token?: string } | undefined;

export async function createPasswordResetAction(formData: FormData): Promise<ResetState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { error: "Falta usuario." };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "Usuario no encontrado." };

  const raw = generateRawToken();
  await prisma.invite.create({
    data: {
      tokenHash: hashToken(raw),
      type: "PASSWORD_RESET",
      name: target.name,
      email: target.email,
      invitedById: admin.id,
      expiresAt: inviteExpiry("PASSWORD_RESET"),
    },
  });

  revalidatePath("/admin/vendedores");
  return { token: raw };
}

export async function toggleVendorDisabledAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "VENDEDOR") return;
  await prisma.user.update({ where: { id: userId }, data: { disabled: !user.disabled } });
  revalidatePath("/admin/vendedores");
}

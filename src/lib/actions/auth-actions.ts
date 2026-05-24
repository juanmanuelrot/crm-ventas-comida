"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/invites";
import { checkRateLimit } from "@/lib/rate-limit";

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginActionState = { error?: string } | undefined;

export async function loginAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Email o contraseña inválidos." };
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rl = checkRateLimit(`login:${ip}`);
  if (!rl.ok) {
    const minutes = Math.ceil(rl.retryAfterMs / 60_000);
    return { error: `Demasiados intentos. Reintentá en ${minutes} min.` };
  }

  const next = String(formData.get("next") ?? "");
  const safeNext = next && next.startsWith("/") ? next : "/";

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeNext,
    });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AuthError) {
      return { error: "Email o contraseña inválidos." };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

const acceptInviteSchema = z
  .object({
    token: z.string().min(10),
    name: z.string().min(2),
    password: z.string().min(8),
    confirm: z.string().min(8),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Las contraseñas no coinciden.",
    path: ["confirm"],
  });

export type InviteActionState = { error?: string } | undefined;

export async function acceptInviteAction(
  _prev: InviteActionState,
  formData: FormData,
): Promise<InviteActionState> {
  const parsed = acceptInviteSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const tokenHash = hashToken(parsed.data.token);
  const invite = await prisma.invite.findUnique({ where: { tokenHash } });

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { error: "Invitación inválida o vencida." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  if (invite.type === "INVITE") {
    if (!invite.email) {
      return { error: "La invitación no tiene email asociado. Pedile al admin que la regenere." };
    }
    const existing = await prisma.user.findUnique({
      where: { email: invite.email.toLowerCase() },
    });
    if (existing) {
      return { error: "Ya existe un usuario con ese email." };
    }

    await prisma.$transaction([
      prisma.user.create({
        data: {
          email: invite.email.toLowerCase(),
          passwordHash,
          name: parsed.data.name,
          role: "VENDEDOR",
        },
      }),
      prisma.invite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      }),
    ]);

    try {
      await signIn("credentials", {
        email: invite.email.toLowerCase(),
        password: parsed.data.password,
        redirectTo: "/dashboard",
      });
    } catch (error) {
      if (isNextRedirect(error)) throw error;
      if (error instanceof AuthError) {
        redirect("/login");
      }
      throw error;
    }
  } else {
    if (!invite.email) {
      return { error: "Reset inválido (sin email)." };
    }
    const user = await prisma.user.findUnique({
      where: { email: invite.email.toLowerCase() },
    });
    if (!user) return { error: "Usuario no encontrado." };

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.invite.update({ where: { id: invite.id }, data: { usedAt: new Date() } }),
    ]);

    try {
      await signIn("credentials", {
        email: user.email,
        password: parsed.data.password,
        redirectTo: user.role === "ADMIN" ? "/admin" : "/dashboard",
      });
    } catch (error) {
      if (isNextRedirect(error)) throw error;
      if (error instanceof AuthError) {
        redirect("/login");
      }
      throw error;
    }
  }
}

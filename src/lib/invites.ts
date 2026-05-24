import crypto from "node:crypto";

export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function inviteExpiry(type: "INVITE" | "PASSWORD_RESET"): Date {
  const ms = type === "INVITE" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
}

export function buildInviteUrl(rawToken: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}/invite/${rawToken}`;
}

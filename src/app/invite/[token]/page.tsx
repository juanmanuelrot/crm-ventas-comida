import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/invites";
import { InviteForm } from "./invite-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenHash = hashToken(token);

  const invite = await prisma.invite.findUnique({ where: { tokenHash } });

  let error: string | null = null;
  if (!invite) error = "Esta invitación no existe o ya fue usada.";
  else if (invite.usedAt) error = "Esta invitación ya fue utilizada.";
  else if (invite.expiresAt < new Date()) error = "Esta invitación venció.";

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_oklch(0.97_0.04_56),transparent_60%)]"
        aria-hidden
      />
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="font-display text-3xl font-semibold tracking-tight">
            Bruno<span className="text-[oklch(0.74_0.16_56)]">Web</span>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            {invite?.type === "PASSWORD_RESET"
              ? "Establecé una nueva contraseña."
              : "Completá tu registro como vendedor."}
          </p>
        </div>
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            {error}
          </p>
        ) : (
          <InviteForm
            token={token}
            type={invite!.type}
            defaultName={invite!.name ?? ""}
            email={invite!.email ?? ""}
          />
        )}
      </div>
    </main>
  );
}

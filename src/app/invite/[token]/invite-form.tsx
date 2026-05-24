"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptInviteAction, type InviteActionState } from "@/lib/actions/auth-actions";

export function InviteForm({
  token,
  type,
  defaultName,
  email,
}: {
  token: string;
  type: "INVITE" | "PASSWORD_RESET";
  defaultName: string;
  email: string;
}) {
  const [state, action, pending] = useActionState<InviteActionState, FormData>(
    acceptInviteAction,
    undefined,
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <form action={action} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        {email ? (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Email
            </Label>
            <Input value={email} disabled readOnly />
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Nombre
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={defaultName}
            disabled={type === "PASSWORD_RESET"}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {type === "PASSWORD_RESET" ? "Nueva contraseña" : "Contraseña"}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Confirmar contraseña
          </Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
          />
        </div>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Guardando…" : type === "PASSWORD_RESET" ? "Guardar contraseña" : "Crear cuenta"}
        </Button>
      </form>
    </div>
  );
}

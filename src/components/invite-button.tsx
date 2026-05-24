"use client";

import { useActionState, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/copy-button";
import {
  createInviteAction,
  type InviteCreateState,
} from "@/lib/actions/invite-actions";

export function InviteButton({ origin }: { origin: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<InviteCreateState, FormData>(
    createInviteAction,
    undefined,
  );

  const hasToken = !!state?.token;
  const link = hasToken && state?.token ? `${origin.replace(/\/$/, "")}/invite/${state.token}` : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Invitar vendedor</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitar vendedor</DialogTitle>
          <DialogDescription>
            Generá un link y compartilo por fuera (whatsapp, mail, etc.). El link expira en 7 días.
          </DialogDescription>
        </DialogHeader>

        {!hasToken ? (
          <form action={formAction} className="space-y-3">
            <div>
              <Label htmlFor="invite-name">Nombre</Label>
              <Input id="invite-name" name="name" required />
            </div>
            <div>
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" type="email" name="email" required />
            </div>
            {state && "error" in state && state.error ? (
              <p className="text-sm text-red-600">{state.error}</p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Generando…" : "Generar link"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm">
              Link para <strong>{state && "name" in state ? state.name : ""}</strong> (
              {state && "email" in state ? state.email : ""}):
            </p>
            <div className="flex gap-2">
              <Input readOnly value={link ?? ""} className="font-mono text-xs" />
              {link ? <CopyButton text={link} /> : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

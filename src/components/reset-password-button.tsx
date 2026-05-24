"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";
import { createPasswordResetAction } from "@/lib/actions/invite-actions";

export function ResetPasswordButton({
  userId,
  origin,
  userName,
}: {
  userId: string;
  origin: string;
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onGenerate() {
    setPending(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("userId", userId);
      const result = await createPasswordResetAction(fd);
      if (result?.error) setError(result.error);
      else if (result?.token) setToken(result.token);
    } finally {
      setPending(false);
    }
  }

  const link = token ? `${origin.replace(/\/$/, "")}/invite/${token}` : null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(true);
          setToken(null);
          setError(null);
        }}
      >
        Resetear contraseña
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetear contraseña — {userName}</DialogTitle>
          </DialogHeader>
          {!link ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-600">
                Se va a generar un link único válido por 24 hs para que el usuario establezca una nueva
                contraseña.
              </p>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <DialogFooter>
                <Button type="button" onClick={onGenerate} disabled={pending}>
                  {pending ? "Generando…" : "Generar link de reset"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input readOnly value={link} className="font-mono text-xs" />
                <CopyButton text={link} />
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
    </>
  );
}

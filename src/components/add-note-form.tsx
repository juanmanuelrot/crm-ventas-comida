"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addNoteAction, type VisitActionState } from "@/lib/actions/visit-actions";

export function AddNoteForm({ visitId }: { visitId: string }) {
  const [state, formAction, pending] = useActionState<VisitActionState, FormData>(
    addNoteAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state?.error) {
      formRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="visitId" value={visitId} />
      <Textarea name="body" placeholder="Agregá una nota…" rows={3} required />
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Guardando…" : "Agregar nota"}
      </Button>
    </form>
  );
}

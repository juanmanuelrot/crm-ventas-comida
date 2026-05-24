"use client";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth-actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" size="sm">
        Cerrar sesión
      </Button>
    </form>
  );
}

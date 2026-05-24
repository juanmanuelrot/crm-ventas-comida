import Link from "next/link";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { AppNav } from "@/components/app-nav";

export async function AppHeader() {
  const session = await auth();
  const user = session?.user;
  if (!user) return null;

  const isAdmin = user.role === "ADMIN";
  const links = isAdmin
    ? [
        { href: "/admin", label: "Resumen" },
        { href: "/admin/visitas", label: "Visitas" },
        { href: "/admin/vendedores", label: "Vendedores" },
        { href: "/admin/metricas", label: "Métricas" },
      ]
    : [
        { href: "/dashboard", label: "Semana" },
        { href: "/visits/new", label: "Nueva visita" },
        { href: "/metricas", label: "Mis métricas" },
      ];

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href={isAdmin ? "/admin" : "/dashboard"}
          className="font-display text-lg font-semibold tracking-tight"
        >
          Bruno<span className="text-[oklch(0.74_0.16_56)]">Web</span>
        </Link>
        <AppNav links={links} />
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium leading-tight">{user.name}</div>
            <div className="text-xs uppercase tracking-wider text-zinc-400">
              {isAdmin ? "Admin" : "Vendedor"}
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

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
    <AppShell
      user={{ name: user.name ?? "" }}
      links={links}
      homeHref={isAdmin ? "/admin" : "/dashboard"}
      roleLabel={isAdmin ? "Admin" : "Vendedor"}
    />
  );
}

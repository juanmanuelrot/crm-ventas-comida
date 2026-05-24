import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_oklch(0.97_0.04_56),transparent_60%)]"
        aria-hidden
      />
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="font-display text-3xl font-semibold tracking-tight">
            Bruno<span className="text-[oklch(0.74_0.16_56)]">Web</span>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            CRM de visitas comerciales. Ingresá con tu email y contraseña.
          </p>
        </div>
        <LoginForm next={sp.next} />
      </div>
    </main>
  );
}

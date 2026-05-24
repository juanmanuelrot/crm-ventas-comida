"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth-actions";

type NavLink = { href: string; label: string };

export function AppShell({
  user,
  links,
  homeHref,
  roleLabel,
}: {
  user: { name: string };
  links: NavLink[];
  homeHref: string;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href={homeHref}
          className="font-display text-lg font-semibold tracking-tight"
          onClick={() => setOpen(false)}
        >
          Bruno<span className="text-[oklch(0.74_0.16_56)]">Web</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {links.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop user + logout */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="text-right">
            <div className="text-sm font-medium leading-tight">{user.name}</div>
            <div className="text-xs uppercase tracking-wider text-zinc-400">
              {roleLabel}
            </div>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Cerrar sesión
            </Button>
          </form>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 md:hidden"
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`md:hidden ${open ? "block" : "hidden"} border-t border-zinc-200 bg-white`}
      >
        <nav className="flex flex-col px-2 py-2">
          {links.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-3 text-base font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 active:bg-zinc-100"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
          <div>
            <div className="text-sm font-medium leading-tight">{user.name}</div>
            <div className="text-xs uppercase tracking-wider text-zinc-400">
              {roleLabel}
            </div>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}

function isActive(pathname: string, href: string) {
  if (href === pathname) return true;
  if (href === "/admin" || href === "/dashboard") return pathname === href;
  return pathname.startsWith(href);
}

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

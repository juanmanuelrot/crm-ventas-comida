"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNav({ links }: { links: Array<{ href: string; label: string }> }) {
  const pathname = usePathname();

  return (
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
  );
}

function isActive(pathname: string, href: string) {
  if (href === pathname) return true;
  if (href === "/admin" || href === "/dashboard") return pathname === href;
  return pathname.startsWith(href);
}

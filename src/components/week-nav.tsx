"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function shiftWeek(iso: string, weeks: number) {
  const d = iso ? new Date(`${iso}T00:00:00`) : new Date();
  d.setDate(d.getDate() + weeks * 7);
  return toIso(d);
}

export function WeekNav({ basePath, weekStartIso }: { basePath: string; weekStartIso: string }) {
  const prev = shiftWeek(weekStartIso, -1);
  const next = shiftWeek(weekStartIso, 1);
  const linkClass = buttonVariants({ variant: "outline", size: "sm" });
  return (
    <div className="flex items-center gap-2">
      <Link href={`${basePath}?w=${prev}`} className={linkClass}>
        ← Semana anterior
      </Link>
      <Link href={basePath} className={linkClass}>
        Esta semana
      </Link>
      <Link href={`${basePath}?w=${next}`} className={linkClass}>
        Semana siguiente →
      </Link>
    </div>
  );
}

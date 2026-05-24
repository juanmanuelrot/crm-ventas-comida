import Link from "next/link";
import { formatTime } from "@/lib/tz";
import { ScoreBadge } from "@/components/score-badge";
import { StatusBadge, ResultadoBadge } from "@/components/status-badge";

type VisitCardData = {
  id: string;
  empresa: string;
  contacto: string;
  zona: string;
  scheduledAt: Date;
  score: number;
  status: string;
  resultadoVenta: string | null;
  vendorName?: string;
};

export function VisitCard({ visit, href }: { visit: VisitCardData; href: string }) {
  return (
    <Link href={href} className="block">
      <article className="group rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <span className="font-display text-sm font-semibold tabular-nums tracking-tight text-zinc-900">
            {formatTime(visit.scheduledAt)}
          </span>
          <div className="flex flex-wrap justify-end gap-1">
            <StatusBadge status={visit.status} />
            <ResultadoBadge resultado={visit.resultadoVenta} />
          </div>
        </div>
        <div className="mt-2">
          <div className="font-display text-base font-semibold leading-tight tracking-tight text-balance">
            {visit.empresa}
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">
            {visit.contacto} · {visit.zona}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <ScoreBadge score={visit.score} />
          {visit.vendorName ? (
            <span className="text-xs text-zinc-500">{visit.vendorName}</span>
          ) : null}
        </div>
      </article>
    </Link>
  );
}

import { Badge } from "@/components/ui/badge";

const CLASS_MAP: Record<string, string> = {
  PENDIENTE: "bg-blue-100 text-blue-800 border-blue-200",
  REALIZADA: "bg-green-100 text-green-800 border-green-200",
  CANCELADA: "bg-zinc-200 text-zinc-700 border-zinc-300",
};

const LABEL_MAP: Record<string, string> = {
  PENDIENTE: "Pendiente",
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={CLASS_MAP[status] ?? ""}>
      {LABEL_MAP[status] ?? status}
    </Badge>
  );
}

const RESULT_LABEL: Record<string, string> = {
  VENDIDA: "Vendida",
  NO_VENDIDA: "No vendida",
  SEGUIMIENTO: "Seguimiento",
};

const RESULT_CLASS: Record<string, string> = {
  VENDIDA: "bg-emerald-100 text-emerald-800 border-emerald-200",
  NO_VENDIDA: "bg-rose-100 text-rose-800 border-rose-200",
  SEGUIMIENTO: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export function ResultadoBadge({ resultado }: { resultado: string | null | undefined }) {
  if (!resultado) return null;
  return (
    <Badge variant="outline" className={RESULT_CLASS[resultado] ?? ""}>
      {RESULT_LABEL[resultado] ?? resultado}
    </Badge>
  );
}

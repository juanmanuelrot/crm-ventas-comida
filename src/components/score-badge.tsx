import { Badge } from "@/components/ui/badge";
import { scoreColor, scoreLabel } from "@/lib/visits";

const CLASS_MAP: Record<"red" | "amber" | "green", string> = {
  red: "bg-red-100 text-red-800 border-red-200",
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  green: "bg-green-100 text-green-800 border-green-200",
};

export function ScoreBadge({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <Badge variant="outline" className={CLASS_MAP[color]}>
      {scoreLabel(score)} · {score}
    </Badge>
  );
}

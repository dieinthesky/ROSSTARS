import { Trophy, Target, Skull, Star, Zap, Activity, Gauge, Crosshair } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: "trophy" | "target" | "skull" | "star" | "zap" | "activity" | "gauge" | "crosshair";
  accent?: boolean;
}

const icons = {
  trophy: Trophy,
  target: Target,
  skull: Skull,
  star: Star,
  zap: Zap,
  activity: Activity,
  gauge: Gauge,
  crosshair: Crosshair,
};

export default function StatsCard({ label, value, icon, accent }: StatsCardProps) {
  const Icon = icons[icon];
  return (
    <div className={`rounded-lg border border-border bg-gradient-card p-4 shadow-card transition-all hover:shadow-glow ${accent ? "border-gold/30" : ""}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${accent ? "bg-gold/10" : "bg-secondary"}`}>
          <Icon className={`h-5 w-5 ${accent ? "text-gold" : "text-muted-foreground"}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold font-heading text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

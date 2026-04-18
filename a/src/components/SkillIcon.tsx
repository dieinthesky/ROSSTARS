import { useState } from "react";
import { Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { skillDisplayName, skillIconUrl } from "@/lib/skillsMeta";
import { useSkillsMetaMap } from "@/context/SkillsMetaContext";

const sizeClass = {
  sm: "h-7 w-7 min-w-[1.75rem]",
  md: "h-9 w-9 min-w-[2.25rem]",
  lg: "h-11 w-11 min-w-[2.75rem]",
} as const;

interface SkillIconProps {
  skillId: number;
  /** Nome vindo da API / mock; substituído pelo nome em skills.json quando existir */
  label?: string;
  size?: keyof typeof sizeClass;
  className?: string;
}

export default function SkillIcon({ skillId, label = "", size = "md", className }: SkillIconProps) {
  const meta = useSkillsMetaMap();
  const src = skillIconUrl(meta, skillId);
  const name = skillDisplayName(meta, skillId, label || `Skill #${skillId}`);
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md border border-border bg-secondary/80",
          sizeClass[size],
          className,
        )}
        title={name}
        aria-label={name}
      >
        <Wand2 className="h-1/2 w-1/2 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      width={44}
      height={44}
      className={cn("rounded-md border border-border bg-secondary/40 object-contain p-0.5", sizeClass[size], className)}
      title={name}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}

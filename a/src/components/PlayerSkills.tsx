import { Progress } from "@/components/ui/progress";
import SkillIcon from "@/components/SkillIcon";
import { skillDisplayName, skillCode } from "@/lib/skillsMeta";
import { useSkillsMetaMap } from "@/context/SkillsMetaContext";

export interface SkillRow {
  skillId: number;
  /** Fallback se skills.json ainda não carregou ou skill não existe no JSON */
  skillName?: string;
  uses: number;
}

interface PlayerSkillsProps {
  skills: SkillRow[];
  title?: string;
}

export default function PlayerSkills({ skills, title = "Skills mais usadas (7×7)" }: PlayerSkillsProps) {
  const meta = useSkillsMetaMap();

  if (!skills.length) {
    return (
      <div className="rounded-lg border border-border bg-gradient-card p-6 shadow-card">
        <h2 className="font-heading text-lg font-bold text-foreground mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground">
          Sem dados de skills neste período. Com ícones: copie a pasta <code className="text-xs">Icones Habilidades</code> do site antigo para{" "}
          <code className="text-xs">public/Icones Habilidades</code> (mesmos nomes que em <code className="text-xs">data/skills.json</code>).
        </p>
      </div>
    );
  }

  const max = Math.max(...skills.map((s) => s.uses), 1);

  return (
    <div className="rounded-lg border border-border bg-gradient-card p-6 shadow-card">
      <h2 className="font-heading text-lg font-bold text-foreground mb-4">{title}</h2>
      <ul className="space-y-4">
        {skills.map((s) => {
          const display = skillDisplayName(meta, s.skillId, s.skillName ?? `Habilidade #${s.skillId}`);
          return (
            <li key={`${s.skillId}-${display}`}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <SkillIcon skillId={s.skillId} label={s.skillName} size="sm" />
                  <div className="min-w-0">
                    <span className="font-medium text-foreground block truncate" title={display}>
                      {display}
                    </span>
                    {meta && skillCode(meta, s.skillId) ? (
                      <span className="text-[10px] text-muted-foreground font-mono truncate block">
                        {skillCode(meta, s.skillId)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-xs text-muted-foreground text-right">
                  #{s.skillId}
                  <br />
                  <span className="text-gold">{s.uses}</span> usos
                </span>
              </div>
              <Progress value={(s.uses / max) * 100} className="h-2 bg-secondary" />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

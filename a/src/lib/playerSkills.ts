import type { SkillRow } from "@/components/PlayerSkills";
import type { RankingPlayerApi } from "@/lib/api";

export function skillsFromApiPlayer(player: RankingPlayerApi): SkillRow[] {
  const raw = player.skills;
  if (!Array.isArray(raw)) return [];
  const out: SkillRow[] = [];
  for (const s of raw) {
    if (!s || typeof s !== "object") continue;
    const o = s as Record<string, unknown>;
    const skillId = Number(o.skillId ?? o.skill_id ?? o.id ?? 0);
    const uses = Number(o.uses ?? o.count ?? 0);
    const skillName = typeof o.skillName === "string" ? o.skillName : typeof o.name === "string" ? o.name : undefined;
    if (!Number.isFinite(skillId) || skillId <= 0) continue;
    out.push({ skillId, uses: Number.isFinite(uses) ? uses : 0, skillName });
  }
  return out.sort((a, b) => b.uses - a.uses);
}

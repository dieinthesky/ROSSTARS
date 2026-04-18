/**
 * Metadados de skills — mesmo contrato que Site Ranking ROS / data/skills.json
 * Chave: skill id (string). Campos: code, name, icon (path relativo tipo "Icones Habilidades/SM_BASH.png")
 */

export type SkillMetaEntry = {
  code?: string;
  name?: string;
  icon?: string;
};

export type SkillsMetaMap = Record<string, SkillMetaEntry>;

/** Base do Vite (deploy em subpasta: import.meta.env.BASE_URL) */
export function publicAssetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const path = relativePath.replace(/^\//, "");
  if (base === "/") {
    return `/${path.split("/").map(encodeURIComponent).join("/")}`;
  }
  const prefix = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${prefix}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export async function fetchSkillsMeta(): Promise<SkillsMetaMap> {
  const url = publicAssetUrl("data/skills.json");
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`skills.json HTTP ${res.status}`);
  }
  const data = await res.json();
  return data && typeof data === "object" ? (data as SkillsMetaMap) : {};
}

export function getSkillMeta(meta: SkillsMetaMap | null, skillId: number): SkillMetaEntry | null {
  if (!meta) return null;
  const e = meta[String(skillId)];
  return e && typeof e === "object" ? e : null;
}

/** URL absoluta para o PNG da skill, ou null se não houver entrada / ícone */
export function skillIconUrl(meta: SkillsMetaMap | null, skillId: number): string | null {
  const e = getSkillMeta(meta, skillId);
  const icon = e?.icon?.trim();
  if (!icon) return null;
  return publicAssetUrl(icon);
}

export function skillDisplayName(meta: SkillsMetaMap | null, skillId: number, fallback: string): string {
  const n = getSkillMeta(meta, skillId)?.name?.trim();
  return n || fallback;
}

export function skillCode(meta: SkillsMetaMap | null, skillId: number): string {
  return getSkillMeta(meta, skillId)?.code?.trim() || "";
}

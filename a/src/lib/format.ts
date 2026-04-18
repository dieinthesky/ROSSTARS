/** YYYY-MM-DD → DD/MM/YYYY */
export function formatMatchDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function firstGuildLabel(a?: string[], b?: string[]): string {
  const x = a?.[0] || b?.[0];
  return x?.trim() || "—";
}

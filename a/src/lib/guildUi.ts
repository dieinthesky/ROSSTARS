import type { GuildApiRow } from "@/lib/api";

const PALETTE = ["#c0392b", "#8e44ad", "#e67e22", "#2980b9", "#27ae60", "#2c3e50", "#d35400", "#16a085"];

export function guildEmblemColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export type GuildCardModel = {
  id: number;
  name: string;
  wins: number;
  losses: number;
  draws: number;
  winRatePct: number;
  totalDamage: number;
  members: number;
  points: number;
  emblemColor: string;
};

export function mapGuildApiToCard(g: GuildApiRow): GuildCardModel {
  const played = g.matchesPlayed || g.wins + g.losses + g.draws;
  const wr = played > 0 ? Math.round((g.wins / played) * 1000) / 10 : 0;
  return {
    id: g.guild_id,
    name: g.name || "—",
    wins: g.wins,
    losses: g.losses,
    draws: g.draws,
    winRatePct: wr,
    totalDamage: g.totalDamage,
    members: g.playerCount,
    points: g.points,
    emblemColor: guildEmblemColor(g.name || String(g.guild_id)),
  };
}

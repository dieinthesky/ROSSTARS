/**
 * Pasta `api/` do PHP (sem barra final).
 * - Produção como site principal: deixe VITE_API_BASE_URL vazio → usa `/api` no mesmo domínio.
 * - Dev noutro host ou API noutro URL: VITE_API_BASE_URL=https://ip/.../api
 */
export function apiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (raw && raw.trim()) {
    return raw.trim().replace(/\/$/, "");
  }
  const base = import.meta.env.BASE_URL || "/";
  const prefix = base === "/" ? "" : base.replace(/\/$/, "");
  return `${prefix}/api`;
}

/** Modo só mock: VITE_USE_MOCK=1 no .env */
export function useMockData(): boolean {
  return import.meta.env.VITE_USE_MOCK === "1";
}

export function isApiConfigured(): boolean {
  return !useMockData();
}

export type GuildApiRow = {
  guild_id: number;
  name: string;
  wins: number;
  losses: number;
  draws: number;
  matchesPlayed: number;
  points: number;
  kills: number;
  deaths: number;
  assists: number;
  totalDamage: number;
  playerCount: number;
  arenaPrefix?: string;
};

export type GuildsApiResponse = {
  guilds: GuildApiRow[];
  arena?: string;
  error?: string;
};

export async function fetchGuilds(arena?: string): Promise<GuildsApiResponse> {
  const base = apiBaseUrl();
  const qs = arena ? `?arena=${encodeURIComponent(arena)}` : "";
  const res = await fetch(`${base}/guilds.php${qs}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  let data: GuildsApiResponse;
  try {
    data = JSON.parse(text) as GuildsApiResponse;
  } catch {
    throw new Error(`Resposta inválida (${res.status}): ${text.slice(0, 120)}`);
  }
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export type ArenasApiResponse = {
  arenas: { prefix: string; label: string; tables?: Record<string, string> }[];
  note?: string;
};

export async function fetchArenas(): Promise<ArenasApiResponse> {
  const base = apiBaseUrl();
  const res = await fetch(`${base}/arenas.php`, { credentials: "include" });
  if (!res.ok) throw new Error(`arenas.php HTTP ${res.status}`);
  return res.json() as Promise<ArenasApiResponse>;
}

// —— ranking_ros (ranking.php, player.php, match.php) ——

export type RankingPlayerApi = {
  id: number;
  jobId: number;
  name: string;
  rating: number;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  kills: number;
  deaths: number;
  kda: number;
  matchesPlayed: number;
  avgDamage: number;
  apm: number;
  skills?: unknown[];
  tag?: string;
};

export type RankingMatchApi = {
  id: number;
  match_date: string;
  team_a_name: string;
  team_b_name: string;
  score_a: number;
  score_b: number;
  totalKills: number;
  players: { id: number; jobId: number; name: string }[];
  guilds_a?: string[];
  guilds_b?: string[];
};

export type RankingApiResponse = {
  stats: {
    matchesPlayed: number;
    players: number;
    playersWithMatches: number;
    avgKills: number;
    apm: number;
    totalKills: number;
  };
  topPlayers: RankingPlayerApi[];
  recentMatches: RankingMatchApi[];
  allMatches?: RankingMatchApi[];
  headerInsights?: { facts: { icon: string; text: string }[] };
};

export async function fetchRanking(opts?: { full?: boolean; expandMatches?: boolean }): Promise<RankingApiResponse> {
  const base = apiBaseUrl();
  const p = new URLSearchParams();
  p.set("historical", "1");
  if (opts?.full) p.set("full", "1");
  if (opts?.expandMatches) p.set("expandMatches", "1");
  const res = await fetch(`${base}/ranking.php?${p.toString()}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  let data: RankingApiResponse;
  try {
    data = JSON.parse(text) as RankingApiResponse;
  } catch {
    throw new Error(`ranking.php inválido (${res.status}): ${text.slice(0, 120)}`);
  }
  if (!res.ok) {
    throw new Error(`ranking.php HTTP ${res.status}`);
  }
  return data;
}

export type PlayerApiResponse = {
  player: RankingPlayerApi;
  recentMatches: unknown[];
  error?: string;
};

export async function fetchPlayer(id: number): Promise<PlayerApiResponse> {
  const base = apiBaseUrl();
  const res = await fetch(`${base}/player.php?id=${encodeURIComponent(String(id))}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  const data = JSON.parse(text) as PlayerApiResponse;
  if (!res.ok) {
    throw new Error(data.error || `player.php HTTP ${res.status}`);
  }
  return data;
}

export type MatchPlayerApi = {
  team: string;
  player_id: number;
  name: string;
  job_id: number;
  kills: number;
  deaths: number;
  kda: number;
  damage?: number;
  apm?: number;
};

export type MatchApiResponse = {
  match: {
    id: number;
    match_date: string;
    team_a_name: string;
    team_b_name: string;
    score_a: number;
    score_b: number;
    guilds_a: string[];
    guilds_b: string[];
    players: MatchPlayerApi[];
    skill_kills?: unknown[];
  };
  error?: string;
};

export async function fetchMatch(id: number): Promise<MatchApiResponse> {
  const base = apiBaseUrl();
  const res = await fetch(`${base}/match.php?id=${encodeURIComponent(String(id))}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  const data = JSON.parse(text) as MatchApiResponse;
  if (!res.ok) {
    throw new Error(data.error || `match.php HTTP ${res.status}`);
  }
  return data;
}

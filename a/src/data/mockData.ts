import { JOB_CLASSES } from "./jobs";

/** Uso de skill (espelha arena `*_match_skill_usage` / API `skills[]`). Nome vem de data/skills.json pelo id. */
export interface SkillUsage {
  skillId: number;
  uses: number;
  skillName?: string;
}

export interface Player {
  id: number;
  name: string;
  job: string;
  guild: string;
  wins: number;
  losses: number;
  draws: number;
  kills: number;
  deaths: number;
  assists: number;
  /** Score agregado (legado UI) */
  score: number;
  mvps: number;
  /** Elo / pontos (api: rating, points) */
  rating: number;
  points: number;
  matchesPlayed: number;
  kda: number;
  avgDamage: number;
  apm: number;
  topSkills: SkillUsage[];
}

export interface Match {
  id: number;
  arena: string;
  date: string;
  teamA: { guild: string; score: number };
  teamB: { guild: string; score: number };
  duration: string;
  mvp: string;
  totalKills: number;
}

export interface Guild {
  id: number;
  name: string;
  wins: number;
  losses: number;
  draws: number;
  totalKills: number;
  totalDeaths: number;
  totalDamage: number;
  winRatePct: number;
  avgScore: number;
  members: number;
  emblemColor: string;
}

export const ARENAS = [
  { prefix: "arena2025", label: "Arena 2025", color: "arena-blue" },
  { prefix: "arena_ayothaya", label: "Ayothaya", color: "arena-green" },
  { prefix: "arena_nif", label: "Niflheim", color: "royal" },
  { prefix: "arena_nightfall", label: "Nightfall", color: "arena-red" },
  { prefix: "arena_somatology", label: "Somatology", color: "arena-blue" },
  { prefix: "toy7", label: "Toy Factory", color: "arena-green" },
];

/** IDs reais (chaves em data/skills.json) — ícones em public/Icones Habilidades/ */
const MOCK_SKILL_IDS = [
  5, 7, 13, 19, 20, 21, 46, 47, 62, 79, 355, 136, 397, 2282, 2299, 5004, 5008,
];

const guilds = ["Crimson Blade", "Shadow Veil", "Phoenix Order", "Frost Legion", "Emerald Guard", "Storm Riders"];
const guildColors = ["#c0392b", "#8e44ad", "#e67e22", "#2980b9", "#27ae60", "#2c3e50"];

const seed = 42;
let _s = seed;
function seededRand() {
  _s = (_s * 16807) % 2147483647;
  return (_s - 1) / 2147483646;
}
function sRand(min: number, max: number) {
  return Math.floor(seededRand() * (max - min + 1)) + min;
}

function pickSkillsForPlayer(playerIndex: number): SkillUsage[] {
  _s = seed + playerIndex * 997;
  const n = sRand(4, 8);
  const pool = [...MOCK_SKILL_IDS];
  const out: SkillUsage[] = [];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = sRand(0, pool.length - 1);
    const id = pool.splice(idx, 1)[0];
    out.push({ skillId: id, uses: sRand(12, 420) });
  }
  return out.sort((a, b) => b.uses - a.uses);
}

const names = [
  "Zephyrus", "KnightStar", "ArcaneBlaze", "SilentArrow", "HolyVanguard",
  "DarkReaper", "MysticBard", "CelestialWing", "IronFist", "ShadowDancer",
  "GoldenShield", "ThunderBolt", "FrostBite", "BladeStorm", "SpiritHealer",
  "NightHawk", "DragonSlayer", "MoonWalker", "StormCaller", "PhoenixRise",
  "CrimsonKnight", "EternalFlame", "VoidWalker", "StarBreaker", "RuneMaster",
  "SilverWind", "OceanTide", "EmberFang", "GhostBlade", "SunGuardian",
];

export const MOCK_PLAYERS: Player[] = names.map((name, i) => {
  _s = seed + i;
  const wins = sRand(20, 150);
  const losses = sRand(10, 80);
  const draws = sRand(0, 25);
  const kills = sRand(100, 800);
  const deaths = sRand(50, 400);
  const assists = sRand(50, 500);
  const matchesPlayed = wins + losses + draws;
  const kda = Math.round(((kills + assists) / Math.max(deaths, 1)) * 100) / 100;
  const avgDamage = sRand(8000, 950000);
  const apm = sRand(45, 220);
  const rating = 1200 + sRand(0, 650) + Math.floor(wins * 1.2);
  const points = rating + sRand(-30, 30);
  const topSkills = pickSkillsForPlayer(i);

  return {
    id: i + 1,
    name,
    job: JOB_CLASSES[i % JOB_CLASSES.length],
    guild: guilds[i % guilds.length],
    wins,
    losses,
    draws,
    kills,
    deaths,
    assists,
    score: wins * 3 + kills - deaths + draws,
    mvps: sRand(0, 30),
    rating,
    points,
    matchesPlayed,
    kda,
    avgDamage,
    apm,
    topSkills,
  };
}).sort((a, b) => b.rating - a.rating);

export const MOCK_MATCHES: Match[] = Array.from({ length: 20 }, (_, i) => {
  _s = seed + i + 100;
  const g1 = sRand(0, 5);
  let g2 = sRand(0, 4);
  if (g2 >= g1) g2++;
  const ka = sRand(50, 200);
  const kb = sRand(50, 200);
  return {
    id: i + 1,
    arena: ARENAS[i % ARENAS.length].label,
    date: `2025-0${sRand(1, 3)}-${String(sRand(1, 28)).padStart(2, "0")}`,
    teamA: { guild: guilds[g1], score: ka },
    teamB: { guild: guilds[g2], score: kb },
    duration: `${sRand(8, 25)}:${String(sRand(0, 59)).padStart(2, "0")}`,
    mvp: names[sRand(0, names.length - 1)],
    totalKills: ka + kb + sRand(0, 40),
  };
});

export const MOCK_GUILDS: Guild[] = guilds.map((name, i) => {
  _s = seed + i + 200;
  const wins = sRand(30, 120);
  const losses = sRand(10, 60);
  const draws = sRand(0, 15);
  const played = wins + losses + draws;
  const totalKills = sRand(500, 3000);
  const totalDeaths = sRand(300, 2000);
  return {
    id: i + 1,
    name,
    wins,
    losses,
    draws,
    totalKills,
    totalDeaths,
    totalDamage: sRand(5_000_000, 120_000_000),
    winRatePct: played > 0 ? Math.round((wins / played) * 1000) / 10 : 0,
    avgScore: sRand(100, 300),
    members: sRand(7, 20),
    emblemColor: guildColors[i],
  };
}).sort((a, b) => b.wins - a.wins);

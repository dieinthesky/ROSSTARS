import { useParams, Link } from "react-router-dom";
import { MOCK_PLAYERS } from "@/data/mockData";
import JobSprite from "@/components/JobSprite";
import StatsCard from "@/components/StatsCard";
import PlayerSkills from "@/components/PlayerSkills";
import { useMockData } from "@/lib/api";
import { usePlayerQuery, usePlayerRankQuery } from "@/hooks/useRankingQuery";
import { jobLabelFromId } from "@/data/jobIds";
import { skillsFromApiPlayer } from "@/lib/playerSkills";

function formatInt(n: number) {
  return n.toLocaleString("pt-BR");
}

export default function PlayerPage() {
  const { id } = useParams();
  const pid = Number(id);
  const mock = useMockData();

  if (mock) {
    return <PlayerPageMock id={pid} />;
  }

  return <PlayerPageLive id={pid} />;
}

function PlayerPageLive({ id }: { id: number }) {
  const pq = usePlayerQuery(id);
  const rankQ = usePlayerRankQuery(id);

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <div className="container py-16 text-center">
        <h1 className="font-heading text-2xl text-foreground">ID inválido</h1>
        <Link to="/ranking" className="mt-4 inline-block text-gold hover:text-gold-light">
          ← Ranking
        </Link>
      </div>
    );
  }

  if (pq.isPending) {
    return (
      <div className="container py-16 text-muted-foreground">
        A carregar jogador…
      </div>
    );
  }

  if (pq.isError || !pq.data?.player) {
    return (
      <div className="container py-16 text-center">
        <h1 className="font-heading text-2xl text-foreground">Jogador não encontrado</h1>
        <p className="text-sm text-muted-foreground mt-2">{pq.error instanceof Error ? pq.error.message : ""}</p>
        <Link to="/ranking" className="mt-4 inline-block text-gold hover:text-gold-light">
          ← Ranking
        </Link>
      </div>
    );
  }

  const player = pq.data.player;
  const job = jobLabelFromId(player.jobId);
  const rank = rankQ.rank;
  const played = player.wins + player.losses + player.draws;
  const winRate = played > 0 ? ((player.wins / played) * 100).toFixed(1) : "0.0";
  const kdaStr = player.kda.toFixed(2);
  const skillRows = skillsFromApiPlayer(player);

  return (
    <div className="container py-8">
      <Link to="/ranking" className="text-sm text-gold hover:text-gold-light mb-4 inline-block">
        ← Ranking completo
      </Link>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="relative">
          <JobSprite jobId={player.jobId} size="lg" className="animate-float" />
          {rank != null ? (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-gradient-gold px-3 py-0.5 text-xs font-bold text-primary-foreground">
              #{rank}
            </div>
          ) : null}
        </div>
        <div className="text-center sm:text-left">
          <h1 className="font-heading text-3xl font-bold text-foreground">{player.name}</h1>
          <p className="text-muted-foreground">
            {job} — <span className="text-gold font-mono">{player.tag ?? "—"}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Rating <span className="font-mono text-gold">{player.rating}</span>
            {" · "}
            Partidas <span className="font-mono text-foreground">{player.matchesPlayed}</span>
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
        <StatsCard label="Rating" value={player.rating} icon="star" accent />
        <StatsCard label="APM" value={player.apm} icon="zap" />
        <StatsCard label="Dano médio" value={formatInt(player.avgDamage)} icon="crosshair" />
        <StatsCard label="KDA" value={kdaStr} icon="target" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatsCard label="Win rate" value={`${winRate}%`} icon="trophy" />
        <StatsCard label="Pontos" value={player.points} icon="gauge" />
        <StatsCard label="Partidas (W/L/D)" value={`${player.wins}/${player.losses}/${player.draws}`} icon="activity" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {[
          { l: "Vitórias", v: player.wins, c: "text-arena-green" },
          { l: "Derrotas", v: player.losses, c: "text-arena-red" },
          { l: "Empates", v: player.draws, c: "text-muted-foreground" },
          { l: "Kills", v: player.kills, c: "text-foreground" },
          { l: "Deaths", v: player.deaths, c: "text-foreground" },
        ].map(({ l, v, c }) => (
          <div key={l} className="rounded-lg border border-border bg-gradient-card p-3 text-center shadow-card">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className={`text-xl font-bold font-heading ${c}`}>{formatInt(v)}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <PlayerSkills skills={skillRows} />
      </div>
    </div>
  );
}

function PlayerPageMock({ id }: { id: number }) {
  const player = MOCK_PLAYERS.find((p) => p.id === id);

  if (!player) {
    return (
      <div className="container py-16 text-center">
        <h1 className="font-heading text-2xl text-foreground">Jogador não encontrado</h1>
        <Link to="/" className="mt-4 inline-block text-gold hover:text-gold-light">
          ← Voltar
        </Link>
      </div>
    );
  }

  const rank = MOCK_PLAYERS.findIndex((p) => p.id === player.id) + 1;
  const played = player.wins + player.losses + player.draws;
  const winRate = played > 0 ? ((player.wins / played) * 100).toFixed(1) : "0.0";
  const kdaStr = player.kda.toFixed(2);

  return (
    <div className="container py-8">
      <Link to="/ranking" className="text-sm text-gold hover:text-gold-light mb-4 inline-block">
        ← Ranking completo
      </Link>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="relative">
          <JobSprite job={player.job} size="lg" className="animate-float" />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-gradient-gold px-3 py-0.5 text-xs font-bold text-primary-foreground">
            #{rank}
          </div>
        </div>
        <div className="text-center sm:text-left">
          <h1 className="font-heading text-3xl font-bold text-foreground">{player.name}</h1>
          <p className="text-muted-foreground">
            {player.job} — <span className="text-gold">{player.guild}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Rating <span className="font-mono text-gold">{player.rating}</span>
            {" · "}
            Partidas <span className="font-mono text-foreground">{player.matchesPlayed}</span>
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
        <StatsCard label="Rating" value={player.rating} icon="star" accent />
        <StatsCard label="APM (médio)" value={player.apm} icon="zap" />
        <StatsCard label="Dano médio" value={formatInt(player.avgDamage)} icon="crosshair" />
        <StatsCard label="KDA" value={kdaStr} icon="target" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatsCard label="Win rate" value={`${winRate}%`} icon="trophy" />
        <StatsCard label="Pontos" value={player.points} icon="gauge" />
        <StatsCard label="MVPs" value={player.mvps} icon="skull" />
        <StatsCard label="Partidas (W/L/D)" value={`${player.wins}/${player.losses}/${player.draws}`} icon="activity" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {[
          { l: "Vitórias", v: player.wins, c: "text-arena-green" },
          { l: "Derrotas", v: player.losses, c: "text-arena-red" },
          { l: "Empates", v: player.draws, c: "text-muted-foreground" },
          { l: "Kills", v: player.kills, c: "text-foreground" },
          { l: "Deaths", v: player.deaths, c: "text-foreground" },
          { l: "Assists", v: player.assists, c: "text-foreground" },
        ].map(({ l, v, c }) => (
          <div key={l} className="rounded-lg border border-border bg-gradient-card p-3 text-center shadow-card">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className={`text-xl font-bold font-heading ${c}`}>{formatInt(v)}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <PlayerSkills skills={player.topSkills} />
      </div>
    </div>
  );
}

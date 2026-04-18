import { Link, useParams } from "react-router-dom";
import { useMockData, type MatchPlayerApi } from "@/lib/api";
import { useMatchQuery } from "@/hooks/useRankingQuery";
import { formatMatchDate } from "@/lib/format";
import JobSprite from "@/components/JobSprite";
import { jobLabelFromId } from "@/data/jobIds";

export default function MatchPage() {
  const { id } = useParams();
  const mid = Number(id);
  const mock = useMockData();

  if (mock) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">Detalhe de partida só com API real.</p>
        <p className="text-xs text-muted-foreground mt-2">Remova VITE_USE_MOCK do .env</p>
        <Link to="/matches" className="mt-6 inline-block text-gold hover:text-gold-light">
          ← Partidas
        </Link>
      </div>
    );
  }

  const q = useMatchQuery(mid);

  if (!Number.isFinite(mid) || mid <= 0) {
    return (
      <div className="container py-16 text-center">
        <p className="text-destructive">ID inválido</p>
        <Link to="/matches" className="mt-4 inline-block text-gold">
          ← Partidas
        </Link>
      </div>
    );
  }

  if (q.isPending) {
    return <div className="container py-16 text-muted-foreground">A carregar partida…</div>;
  }

  if (q.isError || !q.data?.match) {
    return (
      <div className="container py-16 text-center">
        <h1 className="font-heading text-xl text-foreground">Partida não encontrada</h1>
        <p className="text-sm text-muted-foreground mt-2">{q.error instanceof Error ? q.error.message : ""}</p>
        <Link to="/matches" className="mt-4 inline-block text-gold hover:text-gold-light">
          ← Partidas
        </Link>
      </div>
    );
  }

  const m = q.data.match;
  const teamA = m.players.filter((p) => p.team === "a");
  const teamB = m.players.filter((p) => p.team === "b");

  return (
    <div className="container py-8">
      <Link to="/matches" className="text-sm text-gold hover:text-gold-light mb-6 inline-block">
        ← Partidas
      </Link>

      <div className="rounded-lg border border-border bg-gradient-card p-6 shadow-card mb-8">
        <p className="text-xs text-muted-foreground">{formatMatchDate(m.match_date)}</p>
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-12">
          <div className="text-center flex-1 min-w-0">
            <p className="text-lg font-heading font-bold text-foreground truncate">{m.team_a_name}</p>
            <p className={`text-4xl font-bold font-heading mt-2 ${m.score_a > m.score_b ? "text-gold" : "text-muted-foreground"}`}>
              {m.score_a}
            </p>
            {m.guilds_a?.length ? (
              <p className="text-xs text-muted-foreground mt-1 truncate">{m.guilds_a.join(", ")}</p>
            ) : null}
          </div>
          <span className="text-muted-foreground font-heading">VS</span>
          <div className="text-center flex-1 min-w-0">
            <p className="text-lg font-heading font-bold text-foreground truncate">{m.team_b_name}</p>
            <p className={`text-4xl font-bold font-heading mt-2 ${m.score_b > m.score_a ? "text-gold" : "text-muted-foreground"}`}>
              {m.score_b}
            </p>
            {m.guilds_b?.length ? (
              <p className="text-xs text-muted-foreground mt-1 truncate">{m.guilds_b.join(", ")}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Roster title={m.team_a_name} players={teamA} win={m.score_a > m.score_b} />
        <Roster title={m.team_b_name} players={teamB} win={m.score_b > m.score_a} />
      </div>
    </div>
  );
}

function Roster({
  title,
  players,
  win,
}: {
  title: string;
  players: MatchPlayerApi[];
  win: boolean;
}) {
  return (
    <div className={`rounded-lg border p-4 ${win ? "border-gold/40 bg-gold/5" : "border-border bg-card/40"}`}>
      <h2 className="font-heading font-bold text-foreground mb-3 truncate">{title}</h2>
      <ul className="space-y-2">
        {players.map((p) => (
          <li key={p.player_id} className="flex items-center gap-3 text-sm">
            <JobSprite jobId={p.job_id} size="sm" />
            <div className="min-w-0 flex-1">
              <Link to={`/player/${p.player_id}`} className="font-medium text-foreground hover:text-gold truncate block">
                {p.name}
              </Link>
              <span className="text-xs text-muted-foreground">{jobLabelFromId(p.job_id)}</span>
            </div>
            <span className="text-xs font-mono text-muted-foreground shrink-0">
              {p.kills}/{p.deaths}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

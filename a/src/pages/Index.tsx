import { Link } from "react-router-dom";
import { MOCK_PLAYERS, MOCK_MATCHES, MOCK_GUILDS, ARENAS } from "@/data/mockData";
import StatsCard from "@/components/StatsCard";
import RankBadge from "@/components/RankBadge";
import JobSprite from "@/components/JobSprite";
import heroBanner from "@/assets/hero-banner.png";
import { useMockData } from "@/lib/api";
import { useRankingQuery, useGuildsCountQuery } from "@/hooks/useRankingQuery";
import { jobLabelFromId } from "@/data/jobIds";
import { formatMatchDate, firstGuildLabel } from "@/lib/format";

export default function Index() {
  const mock = useMockData();
  const rankingQ = useRankingQuery({});
  const guildsCountQ = useGuildsCountQuery();

  if (mock) {
    return <IndexMock />;
  }

  if (rankingQ.isPending) {
    return (
      <div className="min-h-screen container py-16 text-center text-muted-foreground">
        A carregar ranking…
      </div>
    );
  }

  if (rankingQ.isError) {
    return (
      <div className="min-h-screen container py-16">
        <p className="text-destructive font-medium">Erro ao carregar ranking</p>
        <p className="text-sm text-muted-foreground mt-2">{rankingQ.error instanceof Error ? rankingQ.error.message : String(rankingQ.error)}</p>
        <p className="text-xs text-muted-foreground mt-4">
          Confirme <code className="bg-secondary px-1 rounded">/api/ranking.php</code>, import do <code className="bg-secondary px-1 rounded">schema.sql</code> em{" "}
          <code className="bg-secondary px-1 rounded">ranking_ros</code> e dados nas tabelas.
        </p>
      </div>
    );
  }

  const data = rankingQ.data!;
  const top10 = data.topPlayers.slice(0, 10);
  const stats = data.stats;
  const topKiller = [...data.topPlayers].sort((a, b) => b.kills - a.kills)[0];
  const avgApm =
    data.topPlayers.length > 0
      ? Math.round(data.topPlayers.reduce((s, p) => s + p.apm, 0) / data.topPlayers.length)
      : Math.round(stats.apm);
  const guildCount = guildsCountQ.data ?? "—";

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 opacity-20">
          <img src={heroBanner} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="container relative z-10 py-16 text-center">
          <h1 className="font-heading text-4xl font-bold text-gold sm:text-5xl md:text-6xl tracking-wide">
            RO STARS 7×7
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground text-lg">
            Ranking oficial de Battlegrounds — dados em tempo real (ranking_ros).
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {ARENAS.map((a) => (
              <span key={a.prefix} className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-secondary-foreground">
                {a.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatsCard label="Jogadores (período)" value={stats.players} icon="target" />
          <StatsCard label="Partidas" value={stats.matchesPlayed} icon="trophy" accent />
          <StatsCard label="APM médio" value={Math.round(stats.apm)} icon="zap" />
          <StatsCard label="Guildas (arenas)" value={guildCount} icon="star" />
          <StatsCard label="Top Killer" value={topKiller?.name ?? "—"} icon="skull" />
        </div>
      </section>

      <section className="container pb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-foreground">Top 10 Ranking</h2>
          <Link to="/ranking" className="text-sm text-gold hover:text-gold-light transition-colors">
            Ver todos →
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Jogador</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Classe</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tag</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">W/L/D</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">KDA</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">APM</th>
                <th className="px-4 py-3 text-right font-semibold text-gold">Rating</th>
              </tr>
            </thead>
            <tbody>
              {top10.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Sem jogadores na base ranking_ros.
                  </td>
                </tr>
              ) : (
                top10.map((p, i) => {
                  const job = jobLabelFromId(p.jobId);
                  return (
                    <tr key={p.id} className="border-b border-border/50 transition-colors hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <RankBadge rank={i + 1} />
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/player/${p.id}`} className="font-semibold text-foreground hover:text-gold transition-colors">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <JobSprite jobId={p.jobId} size="sm" />
                          <span className="text-muted-foreground text-xs max-w-[100px] truncate">{job}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.tag ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                        <span className="text-arena-green">{p.wins}</span>/
                        <span className="text-arena-red">{p.losses}</span>/
                        <span>{p.draws}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground font-mono">{p.kda.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">{p.apm}</td>
                      <td className="px-4 py-3 text-right font-bold text-gold font-mono">{p.rating}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="container pb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-foreground">Partidas recentes</h2>
          <Link to="/matches" className="text-sm text-gold hover:text-gold-light transition-colors">
            Ver todas →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.recentMatches.length === 0 ? (
            <p className="text-muted-foreground col-span-full">Nenhuma partida em ranking_ros.</p>
          ) : (
            data.recentMatches.map((m) => (
              <Link
                key={m.id}
                to={`/match/${m.id}`}
                className="rounded-lg border border-border bg-gradient-card p-4 shadow-card transition-all hover:border-gold/30 hover:shadow-glow"
              >
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{firstGuildLabel(m.guilds_a, m.guilds_b)}</span>
                  <span>{formatMatchDate(m.match_date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-center min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{m.team_a_name}</p>
                    <p className={`text-2xl font-bold font-heading ${m.score_a > m.score_b ? "text-gold" : "text-muted-foreground"}`}>
                      {m.score_a}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground font-heading shrink-0 px-1">VS</span>
                  <div className="text-center min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{m.team_b_name}</p>
                    <p className={`text-2xl font-bold font-heading ${m.score_b > m.score_a ? "text-gold" : "text-muted-foreground"}`}>
                      {m.score_b}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{m.totalKills} kills</div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function IndexMock() {
  const top10 = MOCK_PLAYERS.slice(0, 10);
  const totalMatches = MOCK_MATCHES.length;
  const totalPlayers = MOCK_PLAYERS.length;
  const topKiller = [...MOCK_PLAYERS].sort((a, b) => b.kills - a.kills)[0];
  const avgApm =
    MOCK_PLAYERS.length > 0
      ? Math.round(MOCK_PLAYERS.reduce((s, p) => s + p.apm, 0) / MOCK_PLAYERS.length)
      : 0;

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 opacity-20">
          <img src={heroBanner} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="container relative z-10 py-16 text-center">
          <h1 className="font-heading text-4xl font-bold text-gold sm:text-5xl md:text-6xl tracking-wide">
            RO STARS 7×7
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground text-lg">
            Modo demo — defina sem <code className="text-xs">VITE_USE_MOCK</code> para dados reais.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {ARENAS.map((a) => (
              <span key={a.prefix} className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-secondary-foreground">
                {a.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatsCard label="Jogadores" value={totalPlayers} icon="target" />
          <StatsCard label="Partidas" value={totalMatches} icon="trophy" accent />
          <StatsCard label="APM médio" value={avgApm} icon="zap" />
          <StatsCard label="Guildas" value={MOCK_GUILDS.length} icon="star" />
          <StatsCard label="Top Killer" value={topKiller.name} icon="skull" />
        </div>
      </section>

      <section className="container pb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-foreground">Top 10 Ranking</h2>
          <Link to="/ranking" className="text-sm text-gold hover:text-gold-light transition-colors">
            Ver todos →
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Jogador</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Classe</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Guilda</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">W/L/D</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">KDA</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">APM</th>
                <th className="px-4 py-3 text-right font-semibold text-gold">Rating</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((p, i) => (
                <tr key={p.id} className="border-b border-border/50 transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <RankBadge rank={i + 1} />
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/player/${p.id}`} className="font-semibold text-foreground hover:text-gold transition-colors">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <JobSprite job={p.job} size="sm" />
                      <span className="text-muted-foreground text-xs">{p.job}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.guild}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                    <span className="text-arena-green">{p.wins}</span>/
                    <span className="text-arena-red">{p.losses}</span>/
                    <span>{p.draws}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground font-mono">{p.kda.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{p.apm}</td>
                  <td className="px-4 py-3 text-right font-bold text-gold font-mono">{p.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="container pb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-foreground">Partidas Recentes</h2>
          <Link to="/matches" className="text-sm text-gold hover:text-gold-light transition-colors">
            Ver todas →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_MATCHES.slice(0, 6).map((m) => (
            <Link
              key={m.id}
              to="/matches"
              className="rounded-lg border border-border bg-gradient-card p-4 shadow-card transition-all hover:border-gold/30 hover:shadow-glow"
            >
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{m.arena}</span>
                <span>{m.date}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">{m.teamA.guild}</p>
                  <p className={`text-2xl font-bold font-heading ${m.teamA.score > m.teamB.score ? "text-gold" : "text-muted-foreground"}`}>
                    {m.teamA.score}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground font-heading">VS</span>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">{m.teamB.guild}</p>
                  <p className={`text-2xl font-bold font-heading ${m.teamB.score > m.teamA.score ? "text-gold" : "text-muted-foreground"}`}>
                    {m.teamB.score}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>⏱ {m.duration}</span>
                <span>{m.totalKills} kills</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                MVP: <span className="text-gold-light">{m.mvp}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

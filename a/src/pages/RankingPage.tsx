import { Link } from "react-router-dom";
import { MOCK_PLAYERS } from "@/data/mockData";
import RankBadge from "@/components/RankBadge";
import JobSprite from "@/components/JobSprite";
import { useMockData } from "@/lib/api";
import { useRankingQuery } from "@/hooks/useRankingQuery";
import { jobLabelFromId } from "@/data/jobIds";

function formatInt(n: number) {
  return n.toLocaleString("pt-BR");
}

export default function RankingPage() {
  const mock = useMockData();
  const q = useRankingQuery({ full: true });

  if (mock) {
    const list = MOCK_PLAYERS;
    const avgApm = list.length > 0 ? Math.round(list.reduce((s, p) => s + p.apm, 0) / list.length) : 0;
    return (
      <div className="container py-8">
        <p className="text-xs text-muted-foreground mb-4">Modo demo (VITE_USE_MOCK=1)</p>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Ranking completo</h1>
            <p className="text-sm text-muted-foreground mt-1">Dados fictícios.</p>
          </div>
          <p className="text-xs text-muted-foreground font-mono">APM médio do top: {avgApm}</p>
        </div>
        <RankingTableMock list={list} />
      </div>
    );
  }

  if (q.isPending) {
    return (
      <div className="container py-8 text-muted-foreground">
        A carregar ranking…
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="container py-8">
        <p className="text-destructive">{q.error instanceof Error ? q.error.message : String(q.error)}</p>
      </div>
    );
  }

  const list = q.data?.topPlayers ?? [];
  const avgApm = list.length > 0 ? Math.round(list.reduce((s, p) => s + p.apm, 0) / list.length) : 0;

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Ranking completo</h1>
          <p className="text-sm text-muted-foreground mt-1">Fonte: ranking_ros via ranking.php?full=1</p>
        </div>
        <p className="text-xs text-muted-foreground font-mono">APM médio: {avgApm}</p>
      </div>
      <RankingTableLive list={list} />
    </div>
  );
}

function RankingTableLive({ list }: { list: import("@/lib/api").RankingPlayerApi[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border shadow-card">
      <table className="w-full min-w-[920px] text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="px-3 py-3 text-left font-semibold text-muted-foreground">#</th>
            <th className="px-3 py-3 text-left font-semibold text-muted-foreground">Jogador</th>
            <th className="px-3 py-3 text-left font-semibold text-muted-foreground">Classe</th>
            <th className="px-3 py-3 text-left font-semibold text-muted-foreground">Tag</th>
            <th className="px-3 py-3 text-right font-semibold text-muted-foreground">Rating</th>
            <th className="px-3 py-3 text-right font-semibold text-muted-foreground">W/L/D</th>
            <th className="px-3 py-3 text-right font-semibold text-muted-foreground">KDA</th>
            <th className="px-3 py-3 text-right font-semibold text-muted-foreground">APM</th>
            <th className="px-3 py-3 text-right font-semibold text-muted-foreground">Dano médio</th>
            <th className="px-3 py-3 text-right font-semibold text-gold">Skills</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
                Sem jogadores na base.
              </td>
            </tr>
          ) : (
            list.map((p, i) => {
              const job = jobLabelFromId(p.jobId);
              const sk = Array.isArray(p.skills) ? p.skills.length : 0;
              return (
                <tr key={p.id} className="border-b border-border/50 transition-colors hover:bg-secondary/30">
                  <td className="px-3 py-3">
                    <RankBadge rank={i + 1} />
                  </td>
                  <td className="px-3 py-3">
                    <Link to={`/player/${p.id}`} className="font-semibold text-foreground hover:text-gold transition-colors">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <JobSprite jobId={p.jobId} size="sm" />
                      <span className="text-muted-foreground text-xs max-w-[100px] truncate">{job}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground font-mono text-xs">{p.tag ?? "—"}</td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-gold">{p.rating}</td>
                  <td className="px-3 py-3 text-right text-muted-foreground whitespace-nowrap">
                    <span className="text-arena-green">{p.wins}</span>/
                    <span className="text-arena-red">{p.losses}</span>/
                    <span>{p.draws}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono">{p.kda.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right font-mono">{p.apm}</td>
                  <td className="px-3 py-3 text-right font-mono text-muted-foreground">{formatInt(p.avgDamage)}</td>
                  <td className="px-3 py-3 text-right text-gold-light text-xs">{sk}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function RankingTableMock({ list }: { list: typeof MOCK_PLAYERS }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border shadow-card">
      <table className="w-full min-w-[920px] text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="px-3 py-3 text-left font-semibold text-muted-foreground">#</th>
            <th className="px-3 py-3 text-left font-semibold text-muted-foreground">Jogador</th>
            <th className="px-3 py-3 text-left font-semibold text-muted-foreground">Classe</th>
            <th className="px-3 py-3 text-left font-semibold text-muted-foreground">Guilda</th>
            <th className="px-3 py-3 text-right font-semibold text-muted-foreground">Rating</th>
            <th className="px-3 py-3 text-right font-semibold text-muted-foreground">W/L/D</th>
            <th className="px-3 py-3 text-right font-semibold text-muted-foreground">KDA</th>
            <th className="px-3 py-3 text-right font-semibold text-muted-foreground">APM</th>
            <th className="px-3 py-3 text-right font-semibold text-muted-foreground">Dano médio</th>
            <th className="px-3 py-3 text-right font-semibold text-gold">Skills</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p, i) => (
            <tr key={p.id} className="border-b border-border/50 transition-colors hover:bg-secondary/30">
              <td className="px-3 py-3">
                <RankBadge rank={i + 1} />
              </td>
              <td className="px-3 py-3">
                <Link to={`/player/${p.id}`} className="font-semibold text-foreground hover:text-gold transition-colors">
                  {p.name}
                </Link>
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <JobSprite job={p.job} size="sm" />
                  <span className="text-muted-foreground text-xs max-w-[100px] truncate">{p.job}</span>
                </div>
              </td>
              <td className="px-3 py-3 text-muted-foreground max-w-[120px] truncate" title={p.guild}>
                {p.guild}
              </td>
              <td className="px-3 py-3 text-right font-mono font-semibold text-gold">{p.rating}</td>
              <td className="px-3 py-3 text-right text-muted-foreground whitespace-nowrap">
                <span className="text-arena-green">{p.wins}</span>/
                <span className="text-arena-red">{p.losses}</span>/
                <span>{p.draws}</span>
              </td>
              <td className="px-3 py-3 text-right font-mono">{p.kda.toFixed(2)}</td>
              <td className="px-3 py-3 text-right font-mono">{p.apm}</td>
              <td className="px-3 py-3 text-right font-mono text-muted-foreground">{formatInt(p.avgDamage)}</td>
              <td className="px-3 py-3 text-right text-gold-light text-xs">{p.topSkills.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { Link } from "react-router-dom";
import { MOCK_MATCHES } from "@/data/mockData";
import { useMockData } from "@/lib/api";
import { useRankingQuery } from "@/hooks/useRankingQuery";
import { formatMatchDate, firstGuildLabel } from "@/lib/format";

export default function MatchesPage() {
  const mock = useMockData();
  const q = useRankingQuery({ expandMatches: true });

  if (mock) {
    return (
      <div className="container py-8">
        <p className="text-xs text-muted-foreground mb-4">Modo demo</p>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-6">Partidas</h1>
        <MatchesTableMock />
      </div>
    );
  }

  if (q.isPending) {
    return (
      <div className="container py-8 text-muted-foreground">
        A carregar partidas…
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="container py-8">
        <p className="text-destructive">{q.error instanceof Error ? q.error.message : String(q.error)}</p>
        <p className="text-xs text-muted-foreground mt-2">Confirme ranking.php?expandMatches=1</p>
      </div>
    );
  }

  const rows = q.data?.allMatches ?? [];

  return (
    <div className="container py-8">
      <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Partidas</h1>
      <p className="text-xs text-muted-foreground mb-6">Fonte: ranking_ros ({rows.length} partidas)</p>
      <div className="overflow-x-auto rounded-lg border border-border shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Guilda ref.</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Data</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Time A</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Placar</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Time B</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Kills</th>
              <th className="px-4 py-3 text-right font-semibold text-gold">Detalhe</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhuma partida na base.
                </td>
              </tr>
            ) : (
              rows.map((m) => (
                <tr key={m.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[140px] truncate">
                    {firstGuildLabel(m.guilds_a, m.guilds_b)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatMatchDate(m.match_date)}</td>
                  <td className="px-4 py-3 text-center font-semibold text-foreground max-w-[120px] truncate">{m.team_a_name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={m.score_a > m.score_b ? "text-gold font-bold" : "text-muted-foreground"}>{m.score_a}</span>
                    <span className="text-muted-foreground mx-1">×</span>
                    <span className={m.score_b > m.score_a ? "text-gold font-bold" : "text-muted-foreground"}>{m.score_b}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-foreground max-w-[120px] truncate">{m.team_b_name}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{m.totalKills}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/match/${m.id}`} className="text-gold-light hover:text-gold text-sm">
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MatchesTableMock() {
  return (
    <div className="overflow-x-auto rounded-lg border border-border shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Arena</th>
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Data</th>
            <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Time A</th>
            <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Placar</th>
            <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Time B</th>
            <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Kills</th>
            <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Duração</th>
            <th className="px-4 py-3 text-right font-semibold text-gold">MVP</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_MATCHES.map((m) => (
            <tr key={m.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
              <td className="px-4 py-3 text-muted-foreground">{m.arena}</td>
              <td className="px-4 py-3 text-muted-foreground">{m.date}</td>
              <td className="px-4 py-3 text-center font-semibold text-foreground">{m.teamA.guild}</td>
              <td className="px-4 py-3 text-center">
                <span className={m.teamA.score > m.teamB.score ? "text-gold font-bold" : "text-muted-foreground"}>{m.teamA.score}</span>
                <span className="text-muted-foreground mx-1">×</span>
                <span className={m.teamB.score > m.teamA.score ? "text-gold font-bold" : "text-muted-foreground"}>{m.teamB.score}</span>
              </td>
              <td className="px-4 py-3 text-center font-semibold text-foreground">{m.teamB.guild}</td>
              <td className="px-4 py-3 text-right font-mono text-muted-foreground">{m.totalKills}</td>
              <td className="px-4 py-3 text-right text-muted-foreground">{m.duration}</td>
              <td className="px-4 py-3 text-right text-gold-light">{m.mvp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

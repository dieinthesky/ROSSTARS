import { useQuery } from "@tanstack/react-query";
import { MOCK_GUILDS } from "@/data/mockData";
import RankBadge from "@/components/RankBadge";
import { apiBaseUrl, fetchGuilds, isApiConfigured } from "@/lib/api";
import { mapGuildApiToCard, type GuildCardModel } from "@/lib/guildUi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function GuildCard({ g, rank }: { g: GuildCardModel; rank: number }) {
  return (
    <div className="rounded-lg border border-border bg-gradient-card p-5 shadow-card hover:border-gold/30 hover:shadow-glow transition-all">
      <div className="flex items-center gap-3 mb-4">
        <RankBadge rank={rank} />
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-4 w-4 shrink-0 rounded-full" style={{ background: g.emblemColor }} />
          <h3 className="font-heading text-lg font-bold text-foreground truncate">{g.name}</h3>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Vitórias</p>
          <p className="font-semibold text-arena-green">{g.wins}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Derrotas</p>
          <p className="font-semibold text-arena-red">{g.losses}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Empates</p>
          <p className="font-semibold text-muted-foreground">{g.draws}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Win rate</p>
          <p className="font-semibold text-gold">{g.winRatePct}%</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Dano total (arena)</p>
          <p className="font-semibold text-foreground">{g.totalDamage.toLocaleString("pt-BR")}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Jogadores (chars)</p>
          <p className="font-semibold text-foreground">{g.members}</p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground text-xs">Pontos (ranking guildas API)</p>
          <p className="font-semibold text-gold">{g.points.toLocaleString("pt-BR")}</p>
        </div>
      </div>
    </div>
  );
}

export default function GuildsPage() {
  const useLive = isApiConfigured();

  const q = useQuery({
    queryKey: ["guilds", "all"],
    queryFn: () => fetchGuilds(),
    enabled: useLive,
    staleTime: 60_000,
  });

  if (!useLive) {
    return (
      <div className="container py-8">
        <Alert className="mb-6 border-gold/30 bg-secondary/40">
          <AlertTitle>Modo demonstração</AlertTitle>
          <AlertDescription className="text-sm mt-1">
            Está ativo porque <code className="text-xs">VITE_USE_MOCK=1</code> no <code className="text-xs">.env</code>. Para dados reais, remova essa linha.
            Em produção (site principal) o hub usa <code className="text-xs">/api</code> no mesmo domínio — copie a pasta PHP <code className="text-xs">api</code> para junto do build.
            Em <code className="text-xs">npm run dev</code> sem PHP local, defina <code className="text-xs">VITE_API_BASE_URL=https://SEU_SERVIDOR/.../api</code> ou use proxy no <code className="text-xs">vite.config</code>.
          </AlertDescription>
        </Alert>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-6">Guildas</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_GUILDS.map((g, i) => (
            <GuildCard
              key={g.id}
              rank={i + 1}
              g={{
                id: g.id,
                name: g.name,
                wins: g.wins,
                losses: g.losses,
                draws: g.draws,
                winRatePct: g.winRatePct,
                totalDamage: g.totalDamage,
                members: g.members,
                points: g.avgScore,
                emblemColor: g.emblemColor,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (q.isPending) {
    return (
      <div className="container py-8">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-6">Guildas</h1>
        <p className="text-muted-foreground">A carregar de {apiBaseUrl()}…</p>
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="container py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Erro ao ligar à API</AlertTitle>
          <AlertDescription>{q.error instanceof Error ? q.error.message : String(q.error)}</AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          Confirme que <code className="text-xs">guilds.php</code> abre no browser e que o MySQL tem as tabelas{" "}
          <code className="text-xs">*_guild_stats</code> na base <code className="text-xs">ragnarok</code>.
        </p>
      </div>
    );
  }

  const rows = (q.data?.guilds ?? []).map(mapGuildApiToCard);

  return (
    <div className="container py-8">
      <p className="text-xs text-muted-foreground mb-2 font-mono truncate" title={apiBaseUrl()}>
        Fonte: {apiBaseUrl()}/guilds.php · arena: {q.data?.arena ?? "—"}
      </p>
      <h1 className="font-heading text-3xl font-bold text-foreground mb-6">Guildas</h1>
      {rows.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma guilda nas tabelas de arena (ou tabelas em falta).</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((g, i) => (
            <GuildCard key={g.id} rank={i + 1} g={g} />
          ))}
        </div>
      )}
    </div>
  );
}

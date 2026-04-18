import { useQuery } from "@tanstack/react-query";
import { fetchRanking, fetchPlayer, fetchMatch, fetchGuilds, useMockData } from "@/lib/api";

export function useRankingQuery(opts?: { full?: boolean; expandMatches?: boolean }) {
  const mock = useMockData();
  return useQuery({
    queryKey: ["ranking", opts?.full ?? false, opts?.expandMatches ?? false],
    queryFn: () => fetchRanking(opts),
    enabled: !mock,
    staleTime: 30_000,
  });
}

export function usePlayerQuery(id: number | undefined) {
  const mock = useMockData();
  return useQuery({
    queryKey: ["player", id],
    queryFn: () => fetchPlayer(id!),
    enabled: !mock && id != null && id > 0,
    staleTime: 30_000,
  });
}

export function useMatchQuery(id: number | undefined) {
  const mock = useMockData();
  return useQuery({
    queryKey: ["match", id],
    queryFn: () => fetchMatch(id!),
    enabled: !mock && id != null && id > 0,
    staleTime: 60_000,
  });
}

export function useGuildsCountQuery() {
  const mock = useMockData();
  return useQuery({
    queryKey: ["guilds", "count"],
    queryFn: async () => {
      const d = await fetchGuilds();
      return d.guilds?.length ?? 0;
    },
    enabled: !mock,
    staleTime: 60_000,
  });
}

export function usePlayerRankQuery(playerId: number | undefined) {
  const mock = useMockData();
  const q = useQuery({
    queryKey: ["ranking", true, false],
    queryFn: () => fetchRanking({ full: true }),
    enabled: !mock && playerId != null && playerId > 0,
    staleTime: 30_000,
  });
  const rank =
    q.data?.topPlayers?.findIndex((p) => p.id === playerId) ?? -1;
  return { ...q, rank: rank >= 0 ? rank + 1 : null };
}

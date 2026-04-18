interface RankBadgeProps {
  rank: number;
}

export default function RankBadge({ rank }: RankBadgeProps) {
  if (rank === 1)
    return <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-gold text-xs font-bold text-primary-foreground animate-rank-glow">1</span>;
  if (rank === 2)
    return <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-xs font-bold text-primary-foreground">2</span>;
  if (rank === 3)
    return <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-xs font-bold text-primary-foreground">3</span>;
  return <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">{rank}</span>;
}

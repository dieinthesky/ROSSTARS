<?php
declare(strict_types=1);

require __DIR__ . '/db.php';

$arenaPrefix = api_str_param('arena', '');

$arenas = api_arenas();
$pdo = api_pdo('arenas');

$parts = [];
$arenaUsed = null;
foreach ($arenas as $idx => $a) {
    if (!is_array($a)) continue;
    $prefix = (string)($a['prefix'] ?? '');
    if ($arenaPrefix !== '' && $prefix !== $arenaPrefix) continue;
    $t = $a['tables'] ?? [];
    $gs = $t['guild_stats'] ?? null;
    if (!is_string($gs) || $gs === '' || !preg_match('/^[a-zA-Z0-9_]+$/', $gs)) continue;
    $parts[] = "SELECT {$idx} AS arena_idx, guild_id, guild_name, arena_name, wins, losses, draws FROM `{$gs}`";
    if ($arenaPrefix !== '' && $prefix === $arenaPrefix) $arenaUsed = $prefix;
}

if (!$parts) {
    api_json(['guilds' => [], 'arena' => $arenaUsed ?? ($arenaPrefix !== '' ? $arenaPrefix : null)]);
}

$sql = "SELECT
    g.guild_id,
    MAX(g.guild_name) AS name,
    SUM(g.wins) AS wins,
    SUM(g.losses) AS losses,
    SUM(g.draws) AS draws
  FROM (" . implode("\nUNION ALL\n", $parts) . ") g
  GROUP BY g.guild_id
  ORDER BY (SUM(g.wins)*3 + SUM(g.draws)) DESC, SUM(g.wins) DESC
  LIMIT 500";

try {
    $rows = $pdo->query($sql)->fetchAll();
} catch (Throwable $e) {
    api_error('Erro ao consultar guildas: ' . $e->getMessage(), 500);
}

// playerCount (chars) via rAthena guild_member (opcional)
$playerCountByGuild = [];
try {
    $ids = array_values(array_filter(array_map(fn($r) => (int)$r['guild_id'], $rows), fn($x) => $x > 0));
    if ($ids) {
        $in = implode(',', array_fill(0, count($ids), '?'));
        $st = api_pdo('rathena')->prepare("SELECT guild_id, COUNT(*) AS c FROM guild_member WHERE guild_id IN ({$in}) GROUP BY guild_id");
        $st->execute($ids);
        foreach ($st->fetchAll() as $r) {
            $playerCountByGuild[(int)$r['guild_id']] = (int)$r['c'];
        }
    }
} catch (Throwable) {
    $playerCountByGuild = [];
}

$out = [];
foreach ($rows as $r) {
    $wins = (int)$r['wins'];
    $losses = (int)$r['losses'];
    $draws = (int)$r['draws'];
    $matchesPlayed = $wins + $losses + $draws;
    $points = ($wins * 3) + $draws;
    $gid = (int)$r['guild_id'];

    $out[] = [
        'guild_id' => $gid,
        'name' => (string)$r['name'],
        'wins' => $wins,
        'losses' => $losses,
        'draws' => $draws,
        'matchesPlayed' => $matchesPlayed,
        'points' => $points,
        'kills' => 0,
        'deaths' => 0,
        'assists' => 0,
        'totalDamage' => 0,
        'playerCount' => (int)($playerCountByGuild[$gid] ?? 0),
        'arenaPrefix' => $arenaUsed,
    ];
}

api_json([
    'guilds' => $out,
    'arena' => $arenaUsed ?? ($arenaPrefix !== '' ? $arenaPrefix : null),
]);


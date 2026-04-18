<?php
declare(strict_types=1);

require __DIR__ . '/db.php';

$full = api_bool_param('full');
$expandMatches = api_bool_param('expandMatches');

$arenas = api_arenas();
if (!$arenas) {
    api_json([
        'stats' => [
            'matchesPlayed' => 0,
            'players' => 0,
            'playersWithMatches' => 0,
            'avgKills' => 0,
            'apm' => 0,
            'totalKills' => 0,
        ],
        'topPlayers' => [],
        'recentMatches' => [],
        'allMatches' => $expandMatches ? [] : null,
    ]);
}

$pdoArenas = api_pdo('arenas');

// -------- players aggregate (across all arenas) --------
$playerParts = [];
foreach ($arenas as $idx => $a) {
    $t = $a['tables'] ?? [];
    $mp = $t['match_players'] ?? null;
    if (!is_string($mp) || $mp === '') continue;
    // For safety: only allow [a-zA-Z0-9_]
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $mp)) continue;
    $playerParts[] = "SELECT {$idx} AS arena_idx, char_id, char_name, class_id, result, apm, damage_done FROM `{$mp}`";
}

$playersAggSql = "SELECT
    p.char_id AS id,
    MAX(p.class_id) AS jobId,
    MAX(p.char_name) AS name,
    (SUM(p.result = 1)) AS wins,
    (SUM(p.result = 0)) AS losses,
    (SUM(p.result = 2)) AS draws,
    COUNT(*) AS matchesPlayed,
    ROUND(AVG(p.apm)) AS apm,
    ROUND(AVG(p.damage_done)) AS avgDamage
  FROM (
    " . implode("\nUNION ALL\n", $playerParts) . "
  ) p
  GROUP BY p.char_id";

// Derivados (rating/points/kda). Kills/deaths não existem no schema atual → 0.
$topPlayersSql = "SELECT
    x.id,
    x.jobId,
    x.name,
    (x.wins*3 + x.draws) AS points,
    (x.wins*3 + x.draws) AS rating,
    x.wins, x.losses, x.draws,
    0 AS kills,
    0 AS deaths,
    0.0 AS kda,
    x.matchesPlayed,
    x.avgDamage,
    x.apm
  FROM ({$playersAggSql}) x
  WHERE x.matchesPlayed > 0
  ORDER BY rating DESC, matchesPlayed DESC, avgDamage DESC
  LIMIT 500";

try {
    $topPlayers = $pdoArenas->query($topPlayersSql)->fetchAll();
} catch (Throwable $e) {
    api_error('Erro ao consultar players: ' . $e->getMessage(), 500);
}

// Opcional: skills por player (só quando full=1 para reduzir custo).
if ($full && $topPlayers) {
    $skillParts = [];
    foreach ($arenas as $idx => $a) {
        $t = $a['tables'] ?? [];
        $su = $t['skill_usage'] ?? null;
        if (!is_string($su) || $su === '') continue;
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $su)) continue;
        $skillParts[] = "SELECT {$idx} AS arena_idx, char_id, skill_id, skill_name, uses FROM `{$su}`";
    }
    if ($skillParts) {
        $ids = array_map(fn($r) => (int)$r['id'], $topPlayers);
        $ids = array_values(array_filter(array_unique($ids), fn($x) => $x > 0));
        if ($ids) {
            $in = implode(',', array_fill(0, count($ids), '?'));
            $skillsSql = "SELECT char_id, skill_id, MAX(skill_name) AS skillName, SUM(uses) AS uses
              FROM (" . implode("\nUNION ALL\n", $skillParts) . ") s
              WHERE char_id IN ({$in})
              GROUP BY char_id, skill_id
              ORDER BY char_id ASC, uses DESC";
            try {
                $st = $pdoArenas->prepare($skillsSql);
                $st->execute($ids);
                $byChar = [];
                foreach ($st->fetchAll() as $row) {
                    $cid = (int)$row['char_id'];
                    if (!isset($byChar[$cid])) $byChar[$cid] = [];
                    // Cap per player to keep payload sane
                    if (count($byChar[$cid]) >= 25) continue;
                    $byChar[$cid][] = [
                        'skillId' => (int)$row['skill_id'],
                        'skillName' => (string)($row['skillName'] ?? ''),
                        'uses' => (int)$row['uses'],
                    ];
                }
                foreach ($topPlayers as &$p) {
                    $cid = (int)$p['id'];
                    $p['skills'] = $byChar[$cid] ?? [];
                }
                unset($p);
            } catch (Throwable) {
                // Sem skills se der erro (não quebra ranking)
            }
        }
    }
}

// -------- matches aggregate --------
$matchParts = [];
foreach ($arenas as $idx => $a) {
    $t = $a['tables'] ?? [];
    $m = $t['matches'] ?? null;
    if (!is_string($m) || $m === '') continue;
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $m)) continue;
    $matchParts[] = "SELECT {$idx} AS arena_idx, id AS match_id, started_at, blue_alive_end, red_alive_end, winner_team FROM `{$m}`";
}

$matchesSql = "SELECT * FROM (" . implode("\nUNION ALL\n", $matchParts) . ") u ORDER BY started_at DESC";

$recentMatchesRaw = [];
try {
    $recentMatchesRaw = $pdoArenas->query($matchesSql . " LIMIT 20")->fetchAll();
} catch (Throwable $e) {
    api_error('Erro ao consultar partidas: ' . $e->getMessage(), 500);
}

// Pull players for recent matches (for small payload in header cards/pages)
$recentMatches = [];
foreach ($recentMatchesRaw as $row) {
    $arenaIdx = (int)$row['arena_idx'];
    $matchId = (int)$row['match_id'];
    $uid = api_encode_match_uid($arenaIdx, $matchId);

    $blueAlive = (int)($row['blue_alive_end'] ?? 0);
    $redAlive = (int)($row['red_alive_end'] ?? 0);
    $scoreA = $blueAlive;
    $scoreB = $redAlive;

    $totalKills = 0;
    if ($blueAlive >= 0 && $blueAlive <= 7 && $redAlive >= 0 && $redAlive <= 7) {
        $totalKills = (7 - $blueAlive) + (7 - $redAlive);
    }

    $recentMatches[] = [
        'id' => $uid,
        'match_date' => (string)$row['started_at'],
        'team_a_name' => 'Time Azul',
        'team_b_name' => 'Time Vermelho',
        'score_a' => $scoreA,
        'score_b' => $scoreB,
        'totalKills' => $totalKills,
        'players' => [], // preenchido abaixo
        'guilds_a' => [],
        'guilds_b' => [],
    ];
}

// Fill players + guilds for recent matches (N queries, mas N é pequeno)
foreach ($recentMatches as $i => $m) {
    $decoded = api_decode_match_uid((int)$m['id']);
    if (!$decoded) continue;
    $arena = $arenas[$decoded['arenaIndex']] ?? null;
    if (!$arena) continue;
    $t = $arena['tables'] ?? [];
    $mp = $t['match_players'] ?? null;
    if (!is_string($mp) || $mp === '' || !preg_match('/^[a-zA-Z0-9_]+$/', $mp)) continue;

    $st = $pdoArenas->prepare("SELECT char_id, char_name, class_id, team, guild_id FROM `{$mp}` WHERE match_id = ? ORDER BY team ASC, char_id ASC");
    $st->execute([$decoded['matchId']]);
    $rows = $st->fetchAll();

    $guildIdsA = [];
    $guildIdsB = [];
    $players = [];
    foreach ($rows as $r) {
        $team = (int)($r['team'] ?? 0);
        $gid = (int)($r['guild_id'] ?? 0);
        if ($team === 1 && $gid > 0) $guildIdsA[] = $gid;
        if ($team === 2 && $gid > 0) $guildIdsB[] = $gid;
        $players[] = [
            'id' => (int)$r['char_id'],
            'jobId' => (int)$r['class_id'],
            'name' => (string)$r['char_name'],
        ];
    }

    $guildNameMap = api_guild_names(array_merge($guildIdsA, $guildIdsB));
    $gA = array_values(array_unique(array_filter(array_map(fn($gid) => $guildNameMap[$gid] ?? null, $guildIdsA))));
    $gB = array_values(array_unique(array_filter(array_map(fn($gid) => $guildNameMap[$gid] ?? null, $guildIdsB))));

    $recentMatches[$i]['players'] = $players;
    $recentMatches[$i]['guilds_a'] = $gA;
    $recentMatches[$i]['guilds_b'] = $gB;
    if ($gA) $recentMatches[$i]['team_a_name'] = $gA[0];
    if ($gB) $recentMatches[$i]['team_b_name'] = $gB[0];
}

// allMatches (expandMatches=1) – devolve lista completa (sem roster pesado)
$allMatches = null;
if ($expandMatches) {
    $allMatches = [];
    try {
        $raw = $pdoArenas->query($matchesSql . " LIMIT 2000")->fetchAll();
        foreach ($raw as $row) {
            $arenaIdx = (int)$row['arena_idx'];
            $matchId = (int)$row['match_id'];
            $uid = api_encode_match_uid($arenaIdx, $matchId);
            $blueAlive = (int)($row['blue_alive_end'] ?? 0);
            $redAlive = (int)($row['red_alive_end'] ?? 0);
            $totalKills = 0;
            if ($blueAlive >= 0 && $blueAlive <= 7 && $redAlive >= 0 && $redAlive <= 7) {
                $totalKills = (7 - $blueAlive) + (7 - $redAlive);
            }
            $allMatches[] = [
                'id' => $uid,
                'match_date' => (string)$row['started_at'],
                'team_a_name' => 'Time Azul',
                'team_b_name' => 'Time Vermelho',
                'score_a' => $blueAlive,
                'score_b' => $redAlive,
                'totalKills' => $totalKills,
                'players' => [],
                'guilds_a' => [],
                'guilds_b' => [],
            ];
        }
    } catch (Throwable) {
        $allMatches = [];
    }
}

// stats
$matchesPlayed = 0;
try {
    $matchesPlayed = (int)$pdoArenas->query("SELECT COUNT(*) AS c FROM (" . implode("\nUNION ALL\n", $matchParts) . ") m")->fetch()['c'];
} catch (Throwable) {
    $matchesPlayed = count($recentMatchesRaw);
}

$playersCount = 0;
$playersWithMatches = count($topPlayers);
if ($playersWithMatches > 0) {
    $playersCount = $playersWithMatches;
}

$avgApm = 0;
if ($topPlayers) {
    $avgApm = (int)round(array_sum(array_map(fn($p) => (int)($p['apm'] ?? 0), $topPlayers)) / max(count($topPlayers), 1));
}

$totalKills = array_sum(array_map(fn($m) => (int)($m['totalKills'] ?? 0), $recentMatches));
$avgKills = $recentMatches ? round($totalKills / max(count($recentMatches), 1), 2) : 0;

api_json([
    'stats' => [
        'matchesPlayed' => $matchesPlayed,
        'players' => $playersCount,
        'playersWithMatches' => $playersWithMatches,
        'avgKills' => $avgKills,
        'apm' => $avgApm,
        'totalKills' => $totalKills,
    ],
    'topPlayers' => array_map(function ($p) {
        return [
            'id' => (int)$p['id'],
            'jobId' => (int)$p['jobId'],
            'name' => (string)$p['name'],
            'rating' => (int)$p['rating'],
            'points' => (int)$p['points'],
            'wins' => (int)$p['wins'],
            'losses' => (int)$p['losses'],
            'draws' => (int)$p['draws'],
            'kills' => (int)$p['kills'],
            'deaths' => (int)$p['deaths'],
            'kda' => (float)$p['kda'],
            'matchesPlayed' => (int)$p['matchesPlayed'],
            'avgDamage' => (int)$p['avgDamage'],
            'apm' => (int)$p['apm'],
            'skills' => $p['skills'] ?? [],
            'tag' => null,
        ];
    }, $topPlayers),
    'recentMatches' => $recentMatches,
    'allMatches' => $allMatches,
    'headerInsights' => [
        'facts' => [
            ['icon' => 'trophy', 'text' => 'Ranking agregado das arenas 7×7'],
            ['icon' => 'zap', 'text' => 'APM e dano médio calculados por match_players'],
        ],
    ],
]);


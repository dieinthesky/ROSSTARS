<?php
declare(strict_types=1);

require __DIR__ . '/db.php';

$uid = api_int_param('id', 0);
if ($uid <= 0) api_error('ID inválido', 400);

$decoded = api_decode_match_uid($uid);
if (!$decoded) {
    api_error('ID de partida inválido (esperado match_uid)', 400);
}

$arenas = api_arenas();
$arena = $arenas[$decoded['arenaIndex']] ?? null;
if (!$arena) api_error('Arena não encontrada para este match_uid', 404);

$t = $arena['tables'] ?? [];
$mTable = $t['matches'] ?? null;
$mpTable = $t['match_players'] ?? null;
$suTable = $t['skill_usage'] ?? null;

foreach (['matches' => $mTable, 'match_players' => $mpTable, 'skill_usage' => $suTable] as $k => $v) {
    if ($v !== null && (!is_string($v) || $v === '' || !preg_match('/^[a-zA-Z0-9_]+$/', $v))) {
        api_error("Config inválida de tabela ({$k})", 500);
    }
}

$pdo = api_pdo('arenas');

try {
    $st = $pdo->prepare("SELECT id, started_at, blue_alive_end, red_alive_end, winner_team FROM `{$mTable}` WHERE id = ?");
    $st->execute([$decoded['matchId']]);
    $m = $st->fetch();
} catch (Throwable $e) {
    api_error('Erro ao consultar partida: ' . $e->getMessage(), 500);
}

if (!$m) api_error('Partida não encontrada', 404);

// Roster
try {
    $st2 = $pdo->prepare("SELECT char_id, char_name, class_id, team, result, apm, damage_done, guild_id FROM `{$mpTable}` WHERE match_id = ? ORDER BY team ASC, char_id ASC");
    $st2->execute([(int)$m['id']]);
    $rows = $st2->fetchAll();
} catch (Throwable $e) {
    api_error('Erro ao consultar jogadores da partida: ' . $e->getMessage(), 500);
}

$guildIdsA = [];
$guildIdsB = [];
$players = [];
foreach ($rows as $r) {
    $team = (int)($r['team'] ?? 0);
    $gid = (int)($r['guild_id'] ?? 0);
    if ($team === 1 && $gid > 0) $guildIdsA[] = $gid;
    if ($team === 2 && $gid > 0) $guildIdsB[] = $gid;
    $players[] = [
        'team' => $team === 1 ? 'a' : 'b',
        'player_id' => (int)$r['char_id'],
        'name' => (string)$r['char_name'],
        'job_id' => (int)$r['class_id'],
        'kills' => 0,
        'deaths' => 0,
        'kda' => 0.0,
        'damage' => (int)($r['damage_done'] ?? 0),
        'apm' => (int)($r['apm'] ?? 0),
    ];
}

$guildNameMap = api_guild_names(array_merge($guildIdsA, $guildIdsB));
$gA = array_values(array_unique(array_filter(array_map(fn($gid) => $guildNameMap[$gid] ?? null, $guildIdsA))));
$gB = array_values(array_unique(array_filter(array_map(fn($gid) => $guildNameMap[$gid] ?? null, $guildIdsB))));

$teamAName = $gA[0] ?? 'Time Azul';
$teamBName = $gB[0] ?? 'Time Vermelho';

// Skills (resumo do match): top 30 por uses (ambos os times)
$skill_kills = [];
if ($suTable) {
    try {
        $st3 = $pdo->prepare("SELECT skill_id, MAX(skill_name) AS skillName, SUM(uses) AS uses
          FROM `{$suTable}` WHERE match_id = ?
          GROUP BY skill_id
          ORDER BY uses DESC
          LIMIT 30");
        $st3->execute([(int)$m['id']]);
        foreach ($st3->fetchAll() as $s) {
            $skill_kills[] = [
                'skillId' => (int)$s['skill_id'],
                'skillName' => (string)($s['skillName'] ?? ''),
                'uses' => (int)$s['uses'],
            ];
        }
    } catch (Throwable) {
        $skill_kills = [];
    }
}

api_json([
    'match' => [
        'id' => $uid,
        'match_date' => (string)$m['started_at'],
        'team_a_name' => $teamAName,
        'team_b_name' => $teamBName,
        'score_a' => (int)($m['blue_alive_end'] ?? 0),
        'score_b' => (int)($m['red_alive_end'] ?? 0),
        'guilds_a' => $gA,
        'guilds_b' => $gB,
        'players' => $players,
        'skill_kills' => $skill_kills,
    ],
]);


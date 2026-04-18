<?php
declare(strict_types=1);

require __DIR__ . '/db.php';

$id = api_int_param('id', 0);
if ($id <= 0) api_error('ID inválido', 400);

$arenas = api_arenas();
$pdoArenas = api_pdo('arenas');

$playerParts = [];
foreach ($arenas as $idx => $a) {
    $t = $a['tables'] ?? [];
    $mp = $t['match_players'] ?? null;
    if (!is_string($mp) || $mp === '' || !preg_match('/^[a-zA-Z0-9_]+$/', $mp)) continue;
    $playerParts[] = "SELECT {$idx} AS arena_idx, char_id, char_name, class_id, result, apm, damage_done FROM `{$mp}` WHERE char_id = ?";
}
if (!$playerParts) api_error('Arenas não configuradas', 500);

$sql = "SELECT
    x.char_id AS id,
    MAX(x.class_id) AS jobId,
    MAX(x.char_name) AS name,
    (SUM(x.result = 1)) AS wins,
    (SUM(x.result = 0)) AS losses,
    (SUM(x.result = 2)) AS draws,
    COUNT(*) AS matchesPlayed,
    ROUND(AVG(x.apm)) AS apm,
    ROUND(AVG(x.damage_done)) AS avgDamage
  FROM (
    " . implode("\nUNION ALL\n", $playerParts) . "
  ) x
  GROUP BY x.char_id";

try {
    $st = $pdoArenas->prepare($sql);
    // bind for each UNION branch
    $bind = array_fill(0, count($playerParts), $id);
    $st->execute($bind);
    $row = $st->fetch();
} catch (Throwable $e) {
    api_error('Erro ao consultar jogador: ' . $e->getMessage(), 500);
}

if (!$row || (int)$row['id'] <= 0) {
    api_error('Jogador não encontrado', 404);
}

$wins = (int)$row['wins'];
$losses = (int)$row['losses'];
$draws = (int)$row['draws'];
$points = ($wins * 3) + $draws;

// Skills agregadas do player (top 25)
$skills = [];
$skillParts = [];
foreach ($arenas as $idx => $a) {
    $t = $a['tables'] ?? [];
    $su = $t['skill_usage'] ?? null;
    if (!is_string($su) || $su === '' || !preg_match('/^[a-zA-Z0-9_]+$/', $su)) continue;
    $skillParts[] = "SELECT char_id, skill_id, skill_name, uses FROM `{$su}` WHERE char_id = ?";
}
if ($skillParts) {
    $skillsSql = "SELECT skill_id, MAX(skill_name) AS skillName, SUM(uses) AS uses
      FROM (" . implode("\nUNION ALL\n", $skillParts) . ") s
      GROUP BY skill_id
      ORDER BY uses DESC
      LIMIT 25";
    try {
        $st2 = $pdoArenas->prepare($skillsSql);
        $bind2 = array_fill(0, count($skillParts), $id);
        $st2->execute($bind2);
        foreach ($st2->fetchAll() as $s) {
            $skills[] = [
                'skillId' => (int)$s['skill_id'],
                'skillName' => (string)($s['skillName'] ?? ''),
                'uses' => (int)$s['uses'],
            ];
        }
    } catch (Throwable) {
        $skills = [];
    }
}

api_json([
    'player' => [
        'id' => (int)$row['id'],
        'jobId' => (int)$row['jobId'],
        'name' => (string)$row['name'],
        'rating' => $points,
        'points' => $points,
        'wins' => $wins,
        'losses' => $losses,
        'draws' => $draws,
        'kills' => 0,
        'deaths' => 0,
        'kda' => 0.0,
        'matchesPlayed' => (int)$row['matchesPlayed'],
        'avgDamage' => (int)$row['avgDamage'],
        'apm' => (int)$row['apm'],
        'skills' => $skills,
        'tag' => null,
    ],
    'recentMatches' => [],
]);


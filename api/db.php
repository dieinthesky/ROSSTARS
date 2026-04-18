<?php
declare(strict_types=1);

/**
 * Infra mínima da API (PDO + helpers).
 * Endpoints devem apenas `require __DIR__.'/db.php';` e usar as funções abaixo.
 */

$__api_config = require __DIR__ . '/config.local.php';
if (!is_array($__api_config)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Config inválida (config.local.php)'], JSON_UNESCAPED_UNICODE);
    exit;
}

function api_config(): array
{
    /** @var array $__api_config */
    global $__api_config;
    return $__api_config;
}

function api_json(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function api_error(string $message, int $status = 400, array $extra = []): never
{
    api_json(array_merge(['error' => $message], $extra), $status);
}

function api_int_param(string $key, int $default = 0): int
{
    $v = $_GET[$key] ?? null;
    if ($v === null || $v === '') return $default;
    if (is_array($v)) return $default;
    return (int)$v;
}

function api_str_param(string $key, string $default = ''): string
{
    $v = $_GET[$key] ?? null;
    if ($v === null) return $default;
    if (is_array($v)) return $default;
    return trim((string)$v);
}

function api_bool_param(string $key): bool
{
    $v = $_GET[$key] ?? null;
    if ($v === null) return false;
    if (is_array($v)) return false;
    return $v === '1' || strtolower((string)$v) === 'true';
}

function api_pdo(string $dbKey): PDO
{
    static $cache = [];
    if (isset($cache[$dbKey])) return $cache[$dbKey];

    $cfg = api_config();
    $db = $cfg['db'] ?? [];
    $names = $cfg['db_names'] ?? [];
    $dbName = $names[$dbKey] ?? null;
    if (!is_string($dbName) || $dbName === '') {
        api_error("DB não configurado: {$dbKey}", 500);
    }

    $host = (string)($db['host'] ?? '127.0.0.1');
    $port = (int)($db['port'] ?? 3306);
    $user = (string)($db['user'] ?? 'root');
    $pass = (string)($db['pass'] ?? '');

    $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";

    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (Throwable $e) {
        api_error('Falha ao conectar no MySQL: ' . $e->getMessage(), 500);
    }

    $cache[$dbKey] = $pdo;
    return $pdo;
}

function api_arenas(): array
{
    $cfg = api_config();
    $arenas = $cfg['arenas'] ?? [];
    return is_array($arenas) ? $arenas : [];
}

function api_match_uid_stride(): int
{
    $cfg = api_config();
    $s = (int)($cfg['match_uid_stride'] ?? 1000000000);
    return $s > 0 ? $s : 1000000000;
}

/**
 * @return array{arenaIndex:int, matchId:int}|null
 */
function api_decode_match_uid(int $uid): ?array
{
    if ($uid <= 0) return null;
    $stride = api_match_uid_stride();
    $arenaIndex = intdiv($uid, $stride);
    $matchId = $uid % $stride;
    if ($arenaIndex < 0 || $matchId <= 0) return null;
    return ['arenaIndex' => $arenaIndex, 'matchId' => $matchId];
}

function api_encode_match_uid(int $arenaIndex, int $matchId): int
{
    return ($arenaIndex * api_match_uid_stride()) + $matchId;
}

/**
 * @param int[] $guildIds
 * @return array<int, string> guild_id => name
 */
function api_guild_names(array $guildIds): array
{
    $ids = array_values(array_unique(array_filter(array_map('intval', $guildIds), fn($x) => $x > 0)));
    if (!$ids) return [];

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $sql = "SELECT guild_id, name FROM guild WHERE guild_id IN ({$placeholders})";

    try {
        $pdo = api_pdo('rathena');
        $st = $pdo->prepare($sql);
        $st->execute($ids);
        $out = [];
        foreach ($st->fetchAll() as $row) {
            $gid = (int)($row['guild_id'] ?? 0);
            $name = (string)($row['name'] ?? '');
            if ($gid > 0 && $name !== '') $out[$gid] = $name;
        }
        return $out;
    } catch (Throwable) {
        // Se o schema do rAthena for diferente/indisponível, apenas devolve vazio.
        return [];
    }
}


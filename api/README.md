# API PHP — RO STARS (7x7)

Esta pasta implementa a API que o frontend em `ro-stats-hub-main/` espera em produção (mesma origem): `/api/*.php`.

## Endpoints
- `GET arenas.php`
- `GET guilds.php?arena=toy7` (arena opcional)
- `GET ranking.php?full=1&expandMatches=1`
- `GET player.php?id=123`
- `GET match.php?id=<match_uid>`

## Configuração
Edite `config.local.php`.

### Bancos (MySQL)
Por padrão:
- `RATHENA_DB_NAME=ragnarok`
- `ARENAS_DB_NAME=ragnarok`
- `DB_NAME=ranking_ros` (reservado, caso você separe as tabelas no futuro)

Você pode configurar via variáveis de ambiente:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`
- `DB_NAME`, `RATHENA_DB_NAME`, `ARENAS_DB_NAME`

## Match UID (importante)
O hub precisa de um `id` numérico único por partida, mas as tabelas são por arena (cada uma tem seu `id`).

Esta API gera:
\[
match\_uid = arenaIndex \\times 1{,}000{,}000{,}000 + matchId
\]

O `match.php` espera esse `match_uid` em `?id=...`.


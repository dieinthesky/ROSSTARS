<?php
declare(strict_types=1);

/**
 * Copie este arquivo como-is para o servidor web junto com a pasta `api/`.
 *
 * Dica (segurança): prefira configurar por variáveis de ambiente no servidor (Apache/Nginx/FPM)
 * e deixar este arquivo com valores vazios/placeholder.
 */

return [
    // Conexão MySQL
    // Você pode sobrescrever via ENV: DB_HOST, DB_PORT, DB_USER, DB_PASS
    'db' => [
        'host' => getenv('DB_HOST') ?: '127.0.0.1',
        'port' => (int)(getenv('DB_PORT') ?: '3306'),
        'user' => getenv('DB_USER') ?: 'root',
        'pass' => getenv('DB_PASS') ?: '',
    ],

    // Bancos
    // Em muitos setups, as tabelas das arenas estão no mesmo DB do rAthena (`ragnarok`).
    'db_names' => [
        'ranking' => getenv('DB_NAME') ?: 'ranking_ros',
        'rathena' => getenv('RATHENA_DB_NAME') ?: 'ragnarok',
        // Onde estão as tabelas `toy7_matches`, `arena2025_matches`, etc.
        'arenas' => getenv('ARENAS_DB_NAME') ?: (getenv('RATHENA_DB_NAME') ?: 'ragnarok'),
    ],

    /**
     * Arenas disponíveis (prefixo usado nas tabelas SQL).
     * Deve bater com os arquivos em `sql-files/*_battleground.sql`.
     */
    'arenas' => [
        [
            'prefix' => 'toy7',
            'label' => 'Toy Factory 7×7',
            'tables' => [
                'matches' => 'toy7_matches',
                'match_players' => 'toy7_match_players',
                'guild_stats' => 'toy7_guild_stats',
                'skill_usage' => 'toy7_match_skill_usage',
            ],
        ],
        [
            'prefix' => 'arena2025',
            'label' => 'Arena 2025 7×7',
            'tables' => [
                'matches' => 'arena2025_matches',
                'match_players' => 'arena2025_match_players',
                'guild_stats' => 'arena2025_guild_stats',
                'skill_usage' => 'arena2025_match_skill_usage',
            ],
        ],
        [
            'prefix' => 'arena_nif',
            'label' => 'NifHeim 7×7',
            'tables' => [
                'matches' => 'arena_nif_matches',
                'match_players' => 'arena_nif_match_players',
                'guild_stats' => 'arena_nif_guild_stats',
                'skill_usage' => 'arena_nif_match_skill_usage',
            ],
        ],
        [
            'prefix' => 'arena_ayothaya',
            'label' => 'Ayothaya 7×7',
            'tables' => [
                'matches' => 'arena_ayothaya_matches',
                'match_players' => 'arena_ayothaya_match_players',
                'guild_stats' => 'arena_ayothaya_guild_stats',
                'skill_usage' => 'arena_ayothaya_match_skill_usage',
            ],
        ],
        [
            'prefix' => 'arena_somatology',
            'label' => 'Somatology 7×7',
            'tables' => [
                'matches' => 'arena_somatology_matches',
                'match_players' => 'arena_somatology_match_players',
                'guild_stats' => 'arena_somatology_guild_stats',
                'skill_usage' => 'arena_somatology_match_skill_usage',
            ],
        ],
        [
            'prefix' => 'arena_nightfall',
            'label' => 'NightFall 7×7',
            'tables' => [
                'matches' => 'arena_nightfall_matches',
                'match_players' => 'arena_nightfall_match_players',
                'guild_stats' => 'arena_nightfall_guild_stats',
                'skill_usage' => 'arena_nightfall_match_skill_usage',
            ],
        ],
    ],

    // MatchId sintético: match_uid = arenaIndex*1_000_000_000 + match_id
    'match_uid_stride' => 1000000000,
];


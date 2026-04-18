<?php
declare(strict_types=1);

require __DIR__ . '/db.php';

$arenas = [];
foreach (api_arenas() as $a) {
    if (!is_array($a)) continue;
    $prefix = (string)($a['prefix'] ?? '');
    $label = (string)($a['label'] ?? $prefix);
    $tables = $a['tables'] ?? null;
    if ($prefix === '') continue;
    $arenas[] = [
        'prefix' => $prefix,
        'label' => $label !== '' ? $label : $prefix,
        'tables' => is_array($tables) ? $tables : null,
    ];
}

api_json([
    'arenas' => $arenas,
    'note' => 'Arenas configuradas em api/config.local.php',
]);


#pragma once
// Build de distribuição: recompila o overlay depois de mudar o secret no servidor.
// kSecret tem de ser IGUAL a rostars_overlay_secret no map-server (conf/import/rostars_overlay.conf).
namespace rostars_player_build {
inline constexpr const wchar_t kHost[] = L"56.126.163.148";
inline constexpr unsigned kPort = 5999u; // API HTTP do overlay (não é map_port 37893)
inline constexpr const wchar_t kSecret[] = L"change_me_to_a_long_random_string";
// Substring do título da janela do cliente (para o overlay colar ao jogo).
inline constexpr const wchar_t kGameTitle[] = L"RO STARS 2026";
}

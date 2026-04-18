// Rostars BG overlay — polls map-server HTTP API (no client injection).
// Player package: fill rostars_player_build.hpp and build — jogadores só recebem o .exe (INI opcional para dev).
// Session: cliente patchado escreve %LOCALAPPDATA%\<session_subfolder>\rostars_session.json — session_file_for_client.txt

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <winhttp.h>

#include "rostars_player_build.hpp"

#include <ctime>
#include <cstdlib>
#include <cstdio>
#include <cstring>
#include <string>
#include <vector>

namespace {

constexpr wchar_t kWndClass[] = L"RostarsBgOverlayWnd";
constexpr COLORREF kChromaKey = RGB(255, 0, 255);

struct Config {
	std::wstring host = L"127.0.0.1";
	INTERNET_PORT port = 5999;
	std::wstring account_id = L"0";
	std::wstring char_id = L"0";
	std::wstring secret;
	UINT poll_ms = 1000;
	std::wstring game_title_substr = L"Ragnarok";
	int win_w = 340;
	int win_h = 150;
	/// 1 = read account_id/char_id from session JSON (written by patched client). 0 = use INI only.
	int use_session_file = 1;
	std::wstring session_subfolder = L"RostarsOnline";
	int session_max_age_sec = 180;
};

Config g_cfg;
HWND g_hwnd;
bool g_active = false;
long long g_remaining = 0;
std::wstring g_name_a, g_name_b;
int g_surv_a = 0, g_surv_b = 0;
std::wstring g_status = L"Starting…";

std::wstring Utf8ToWide(const std::string &u)
{
	if (u.empty())
		return L"";
	int n = MultiByteToWideChar(CP_UTF8, 0, u.c_str(), static_cast<int>(u.size()), nullptr, 0);
	if (n <= 0)
		return L"";
	std::wstring w(static_cast<size_t>(n), L'\0');
	MultiByteToWideChar(CP_UTF8, 0, u.c_str(), static_cast<int>(u.size()), w.data(), n);
	return w;
}

std::wstring IniPath()
{
	wchar_t path[MAX_PATH]{};
	GetModuleFileNameW(nullptr, path, MAX_PATH);
	wchar_t *slash = wcsrchr(path, L'\\');
	if (slash)
		*(slash + 1) = L'\0';
	std::wstring p(path);
	p += L"rostars_overlay.ini";
	return p;
}

void LoadConfig()
{
	const std::wstring ini = IniPath();
	const DWORD ini_attr = GetFileAttributesW(ini.c_str());
	const bool have_ini = (ini_attr != INVALID_FILE_ATTRIBUTES && !(ini_attr & FILE_ATTRIBUTE_DIRECTORY));
	wchar_t buf[1024]{};

	const wchar_t *def_host = rostars_player_build::kHost[0] ? rostars_player_build::kHost : L"127.0.0.1";
	const int def_port = rostars_player_build::kPort ? static_cast<int>(rostars_player_build::kPort) : 5999;
	const wchar_t *def_secret = rostars_player_build::kSecret;
	const wchar_t *def_title = rostars_player_build::kGameTitle[0] ? rostars_player_build::kGameTitle : L"Ragnarok";

	if (have_ini) {
		GetPrivateProfileStringW(L"overlay", L"host", def_host, buf, 1024, ini.c_str());
		g_cfg.host = buf;
		g_cfg.port = static_cast<INTERNET_PORT>(GetPrivateProfileIntW(L"overlay", L"port", def_port, ini.c_str()));

		GetPrivateProfileStringW(L"overlay", L"account_id", L"0", buf, 1024, ini.c_str());
		g_cfg.account_id = buf;
		GetPrivateProfileStringW(L"overlay", L"char_id", L"0", buf, 1024, ini.c_str());
		g_cfg.char_id = buf;
		GetPrivateProfileStringW(L"overlay", L"secret", def_secret, buf, 1024, ini.c_str());
		g_cfg.secret = buf;

		g_cfg.poll_ms = static_cast<UINT>(GetPrivateProfileIntW(L"overlay", L"poll_ms", 1000, ini.c_str()));
		if (g_cfg.poll_ms < 200)
			g_cfg.poll_ms = 200;

		GetPrivateProfileStringW(L"overlay", L"game_title", def_title, buf, 1024, ini.c_str());
		g_cfg.game_title_substr = buf;

		g_cfg.win_w = GetPrivateProfileIntW(L"overlay", L"width", 340, ini.c_str());
		g_cfg.win_h = GetPrivateProfileIntW(L"overlay", L"height", 150, ini.c_str());

		g_cfg.use_session_file = GetPrivateProfileIntW(L"overlay", L"use_session_file", 1, ini.c_str());
		g_cfg.session_max_age_sec = GetPrivateProfileIntW(L"overlay", L"session_max_age_sec", 180, ini.c_str());
		if (g_cfg.session_max_age_sec < 30)
			g_cfg.session_max_age_sec = 30;
		GetPrivateProfileStringW(L"overlay", L"session_subfolder", L"RostarsOnline", buf, 1024, ini.c_str());
		g_cfg.session_subfolder = buf;
	} else {
		g_cfg.host = def_host;
		g_cfg.port = static_cast<INTERNET_PORT>(def_port);
		g_cfg.secret = def_secret;
		g_cfg.account_id = L"0";
		g_cfg.char_id = L"0";
		g_cfg.poll_ms = 1000;
		g_cfg.game_title_substr = def_title;
		g_cfg.win_w = 340;
		g_cfg.win_h = 150;
		g_cfg.use_session_file = 1;
		g_cfg.session_max_age_sec = 180;
		g_cfg.session_subfolder = L"RostarsOnline";
	}
}

static bool JsonExtractInt64(const std::string &j, const char *key, long long *out);

static std::wstring ExeDir()
{
	wchar_t path[MAX_PATH]{};
	GetModuleFileNameW(nullptr, path, MAX_PATH);
	wchar_t *slash = wcsrchr(path, L'\\');
	if (slash)
		*(slash + 1) = L'\0';
	return std::wstring(path);
}

static bool ReadFileUtf8(const std::wstring &path, std::string &content)
{
	HANDLE h = CreateFileW(path.c_str(), GENERIC_READ,
		FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
		nullptr, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, nullptr);
	if (h == INVALID_HANDLE_VALUE)
		return false;
	LARGE_INTEGER sz{};
	if (!GetFileSizeEx(h, &sz) || sz.QuadPart <= 0 || sz.QuadPart > 65536) {
		CloseHandle(h);
		return false;
	}
	content.resize(static_cast<size_t>(sz.QuadPart));
	DWORD rd = 0;
	const BOOL ok = ReadFile(h, content.data(), static_cast<DWORD>(sz.QuadPart), &rd, nullptr);
	CloseHandle(h);
	if (!ok || rd == 0)
		return false;
	content.resize(rd);
	return true;
}

static std::wstring LocalAppDataSessionPath()
{
	wchar_t base[MAX_PATH]{};
	if (GetEnvironmentVariableW(L"LOCALAPPDATA", base, MAX_PATH) == 0)
		return L"";
	std::wstring p(base);
	p += L"\\";
	p += g_cfg.session_subfolder;
	p += L"\\rostars_session.json";
	return p;
}

static bool ParseSessionJson(const std::string &j, unsigned long *out_aid, unsigned long *out_cid, long long *out_ts)
{
	long long aid = 0, cid = 0, ts = 0;
	if (!JsonExtractInt64(j, "account_id", &aid) || !JsonExtractInt64(j, "char_id", &cid) || !JsonExtractInt64(j, "ts", &ts))
		return false;
	if (aid <= 0 || cid <= 0)
		return false;
	*out_aid = static_cast<unsigned long>(aid);
	*out_cid = static_cast<unsigned long>(cid);
	*out_ts = ts;
	return true;
}

static bool SessionTimestampOk(long long ts)
{
	const std::time_t now = std::time(nullptr);
	const long long delta = static_cast<long long>(now) - ts;
	if (delta < -60 || delta > g_cfg.session_max_age_sec)
		return false;
	return true;
}

static std::wstring ULongToW(unsigned long v)
{
	wchar_t b[32]{};
	swprintf_s(b, L"%lu", v);
	return std::wstring(b);
}

/// Fills account_id / char_id for the HTTP request. Returns false if session mode and no valid session.
static bool ResolvePlayerIds(std::wstring &account_out, std::wstring &char_out)
{
	if (!g_cfg.use_session_file) {
		if (g_cfg.account_id == L"0" || g_cfg.char_id.empty() || g_cfg.account_id.empty() || g_cfg.char_id == L"0")
			return false;
		account_out = g_cfg.account_id;
		char_out = g_cfg.char_id;
		return true;
	}

	const std::wstring paths[2] = { ExeDir() + L"rostars_session.json", LocalAppDataSessionPath() };
	for (const std::wstring &p : paths) {
		std::string raw;
		if (!ReadFileUtf8(p, raw))
			continue;
		unsigned long aid = 0, cid = 0;
		long long ts = 0;
		if (!ParseSessionJson(raw, &aid, &cid, &ts))
			continue;
		if (!SessionTimestampOk(ts))
			continue;
		account_out = ULongToW(aid);
		char_out = ULongToW(cid);
		return true;
	}
	return false;
}

static bool JsonExtractBool(const std::string &j, const char *key, bool *out)
{
	const std::string needle = std::string("\"") + key + "\"";
	size_t p = j.find(needle);
	if (p == std::string::npos)
		return false;
	p = j.find(':', p);
	if (p == std::string::npos)
		return false;
	++p;
	while (p < j.size() && (j[p] == ' ' || j[p] == '\t'))
		++p;
	if (p + 4 <= j.size() && j.compare(p, 4, "true") == 0) {
		*out = true;
		return true;
	}
	if (p + 5 <= j.size() && j.compare(p, 5, "false") == 0) {
		*out = false;
		return true;
	}
	return false;
}

static bool JsonExtractInt64(const std::string &j, const char *key, long long *out)
{
	const std::string needle = std::string("\"") + key + "\"";
	size_t p = j.find(needle);
	if (p == std::string::npos)
		return false;
	p = j.find(':', p);
	if (p == std::string::npos)
		return false;
	++p;
	while (p < j.size() && (j[p] == ' ' || j[p] == '\t'))
		++p;
	char *end = nullptr;
	long long v = strtoll(j.c_str() + p, &end, 10);
	if (end == j.c_str() + p)
		return false;
	*out = v;
	return true;
}

static bool JsonExtractStringField(const std::string &j, size_t search_from, const char *key, std::string *out)
{
	const std::string needle = std::string("\"") + key + "\":\"";
	size_t p = j.find(needle, search_from);
	if (p == std::string::npos)
		return false;
	p += needle.size();
	std::string s;
	for (; p < j.size(); ++p) {
		if (j[p] == '\\' && p + 1 < j.size()) {
			char n = j[p + 1];
			if (n == 'n')
				s += '\n';
			else if (n == 't')
				s += '\t';
			else if (n == 'r')
				s += '\r';
			else if (n == '"' || n == '\\')
				s += n;
			else
				s += n;
			++p;
			continue;
		}
		if (j[p] == '"')
			break;
		s += j[p];
	}
	*out = std::move(s);
	return true;
}

static bool JsonExtractIntAfter(const std::string &j, size_t search_from, const char *key, int *out)
{
	const std::string needle = std::string("\"") + key + "\"";
	size_t p = j.find(needle, search_from);
	if (p == std::string::npos)
		return false;
	p = j.find(':', p);
	if (p == std::string::npos)
		return false;
	++p;
	while (p < j.size() && (j[p] == ' ' || j[p] == '\t'))
		++p;
	char *end = nullptr;
	long v = strtol(j.c_str() + p, &end, 10);
	if (end == j.c_str() + p)
		return false;
	*out = static_cast<int>(v);
	return true;
}

static void ParseOverlayJson(const std::string &body)
{
	bool act = false;
	if (!JsonExtractBool(body, "active", &act)) {
		g_status = L"Bad JSON (active)";
		g_active = false;
		return;
	}
	g_active = act;
	if (!act) {
		g_status = L"Not in BG";
		g_name_a.clear();
		g_name_b.clear();
		g_surv_a = g_surv_b = 0;
		g_remaining = 0;
		return;
	}

	long long rem = 0;
	JsonExtractInt64(body, "remaining_sec", &rem);
	g_remaining = rem;

	size_t ta = body.find("\"team_a\"");
	size_t tb = body.find("\"team_b\"");
	std::string na, nb;
	if (ta != std::string::npos)
		JsonExtractStringField(body, ta, "name", &na);
	if (tb != std::string::npos)
		JsonExtractStringField(body, tb, "name", &nb);
	int sa = 0, sb = 0;
	if (ta != std::string::npos)
		JsonExtractIntAfter(body, ta, "survived", &sa);
	if (tb != std::string::npos)
		JsonExtractIntAfter(body, tb, "survived", &sb);

	g_name_a = Utf8ToWide(na);
	g_name_b = Utf8ToWide(nb);
	g_surv_a = sa;
	g_surv_b = sb;
	g_status = L"OK";
}

static std::string HttpGet(const std::wstring &path_and_query)
{
	std::string result;
	HINTERNET ses = WinHttpOpen(L"RostarsBgOverlay/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY,
		WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
	if (!ses)
		return result;

	HINTERNET con = WinHttpConnect(ses, g_cfg.host.c_str(), g_cfg.port, 0);
	if (!con) {
		WinHttpCloseHandle(ses);
		return result;
	}

	HINTERNET req = WinHttpOpenRequest(con, L"GET", path_and_query.c_str(), nullptr,
		WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, 0);
	if (!req) {
		WinHttpCloseHandle(con);
		WinHttpCloseHandle(ses);
		return result;
	}

	BOOL ok = WinHttpSendRequest(req, WINHTTP_NO_ADDITIONAL_HEADERS, 0,
		WINHTTP_NO_REQUEST_DATA, 0, 0, 0)
		&& WinHttpReceiveResponse(req, nullptr);
	if (!ok) {
		WinHttpCloseHandle(req);
		WinHttpCloseHandle(con);
		WinHttpCloseHandle(ses);
		return result;
	}

	DWORD avail = 0;
	std::vector<char> chunk;
	do {
		avail = 0;
		if (!WinHttpQueryDataAvailable(req, &avail)) {
			break;
		}
		if (avail == 0)
			break;
		size_t old = result.size();
		result.resize(old + avail);
		DWORD read = 0;
		if (!WinHttpReadData(req, result.data() + old, avail, &read) || read == 0) {
			result.resize(old);
			break;
		}
		result.resize(old + read);
	} while (avail > 0);

	WinHttpCloseHandle(req);
	WinHttpCloseHandle(con);
	WinHttpCloseHandle(ses);
	return result;
}

struct EnumCtx {
	const std::wstring *substr;
	HWND found;
};

BOOL CALLBACK EnumTopLevel(HWND w, LPARAM lp)
{
	auto *ctx = reinterpret_cast<EnumCtx *>(lp);
	if (!IsWindowVisible(w))
		return TRUE;
	wchar_t title[256]{};
	GetWindowTextW(w, title, 255);
	if (title[0] == L'\0')
		return TRUE;
	if (wcsstr(title, ctx->substr->c_str()) != nullptr) {
		ctx->found = w;
		return FALSE;
	}
	return TRUE;
}

static HWND FindGameWindow()
{
	EnumCtx ctx{ &g_cfg.game_title_substr, nullptr };
	EnumWindows(EnumTopLevel, reinterpret_cast<LPARAM>(&ctx));
	return ctx.found;
}

static void PlaceOverGame()
{
	HWND game = FindGameWindow();
	if (!game || !IsWindow(game)) {
		return;
	}
	RECT gr{};
	if (!GetWindowRect(game, &gr))
		return;
	RECT wr{};
	GetWindowRect(g_hwnd, &wr);
	int w = wr.right - wr.left;
	int h = wr.bottom - wr.top;
	int x = gr.right - w - 12;
	int y = gr.top + 8;
	if (x < 0)
		x = 0;
	SetWindowPos(g_hwnd, HWND_TOPMOST, x, y, 0, 0, SWP_NOSIZE | SWP_NOACTIVATE);
}

static void PollApi()
{
	if (g_cfg.secret.empty()) {
		g_status = L"Missing secret: set rostars_player_build.hpp or rostars_overlay.ini";
		g_active = false;
		return;
	}

	std::wstring acc, cid;
	if (!ResolvePlayerIds(acc, cid)) {
		if (g_cfg.use_session_file)
			g_status = L"Waiting for game (client must write session file)";
		else
			g_status = L"Set account_id and char_id in INI or use_session_file=1";
		g_active = false;
		return;
	}

	std::wstring path = L"/rostars/bg.json?account_id=";
	path += acc;
	path += L"&char_id=";
	path += cid;
	path += L"&secret=";
	path += g_cfg.secret;

	std::string body = HttpGet(path);
	if (body.empty()) {
		g_status = L"HTTP failed (map-server running? port?)";
		g_active = false;
		return;
	}
	ParseOverlayJson(body);
	PlaceOverGame();
}

static void DrawPanel(HDC hdc, RECT rc)
{
	HBRUSH bg = CreateSolidBrush(kChromaKey);
	FillRect(hdc, &rc, bg);
	DeleteObject(bg);

	SetBkMode(hdc, TRANSPARENT);
	SetTextColor(hdc, RGB(240, 240, 245));

	HFONT f = CreateFontW(-18, 0, 0, 0, FW_SEMIBOLD, 0, 0, 0, DEFAULT_CHARSET,
		OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI");
	HFONT old = static_cast<HFONT>(SelectObject(hdc, f));

	wchar_t line[512]{};
	int y = 8;
	if (g_active) {
		swprintf_s(line, L"Remaining time: %lld s", g_remaining);
		TextOutW(hdc, 10, y, line, static_cast<int>(wcslen(line)));
		y += 26;
		swprintf_s(line, L"A  %ls  —  Survived: %d", g_name_a.empty() ? L"(no guild)" : g_name_a.c_str(), g_surv_a);
		TextOutW(hdc, 10, y, line, static_cast<int>(wcslen(line)));
		y += 24;
		swprintf_s(line, L"B  %ls  —  Survived: %d", g_name_b.empty() ? L"(no guild)" : g_name_b.c_str(), g_surv_b);
		TextOutW(hdc, 10, y, line, static_cast<int>(wcslen(line)));
	} else {
		TextOutW(hdc, 10, y, g_status.c_str(), static_cast<int>(g_status.size()));
	}

	SelectObject(hdc, old);
	DeleteObject(f);
}

static LRESULT CALLBACK WndProc(HWND w, UINT msg, WPARAM wp, LPARAM lp)
{
	switch (msg) {
		case WM_CREATE:
			SetTimer(w, 1, g_cfg.poll_ms, nullptr);
			return 0;
		case WM_TIMER:
			if (wp == 1) {
				PollApi();
				InvalidateRect(w, nullptr, FALSE);
			}
			return 0;
		case WM_PAINT: {
			PAINTSTRUCT ps{};
			HDC hdc = BeginPaint(w, &ps);
			RECT rc{};
			GetClientRect(w, &rc);
			DrawPanel(hdc, rc);
			EndPaint(w, &ps);
			return 0;
		}
		case WM_DESTROY:
			KillTimer(w, 1);
			PostQuitMessage(0);
			return 0;
		default:
			return DefWindowProcW(w, msg, wp, lp);
	}
}

} // namespace

int WINAPI wWinMain(HINSTANCE hi, HINSTANCE, PWSTR, int show)
{
	LoadConfig();

	const DWORD ini_attr = GetFileAttributesW(IniPath().c_str());
	const bool have_ini = (ini_attr != INVALID_FILE_ATTRIBUTES && !(ini_attr & FILE_ATTRIBUTE_DIRECTORY));
	if (!have_ini) {
		if (!rostars_player_build::kHost[0] || !rostars_player_build::kSecret[0]) {
			MessageBoxW(nullptr,
				L"Build para jogadores sem rostars_overlay.ini:\n"
				L"Edita rostars_player_build.hpp (kHost, kPort, kSecret) e recompila.",
				L"Rostars BG overlay", MB_ICONERROR);
			return 1;
		}
	}

	WNDCLASSEXW wc{};
	wc.cbSize = sizeof(wc);
	wc.lpfnWndProc = WndProc;
	wc.hInstance = hi;
	wc.hCursor = LoadCursor(nullptr, IDC_ARROW);
	wc.lpszClassName = kWndClass;
	wc.hbrBackground = CreateSolidBrush(kChromaKey);
	RegisterClassExW(&wc);

	const DWORD ex = WS_EX_TOPMOST | WS_EX_LAYERED | WS_EX_TOOLWINDOW;
	const DWORD st = WS_POPUP;
	g_hwnd = CreateWindowExW(ex, kWndClass, L"Rostars BG", st,
		100, 100, g_cfg.win_w, g_cfg.win_h, nullptr, nullptr, hi, nullptr);
	if (!g_hwnd)
		return 1;

	SetLayeredWindowAttributes(g_hwnd, kChromaKey, 0, LWA_COLORKEY);
	ShowWindow(g_hwnd, show);
	UpdateWindow(g_hwnd);

	MSG msg{};
	while (GetMessageW(&msg, nullptr, 0, 0)) {
		TranslateMessage(&msg);
		DispatchMessageW(&msg);
	}
	return static_cast<int>(msg.wParam);
}

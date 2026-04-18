#include "hud.hpp"

#include <Windows.h>

#include <algorithm>
#include <atomic>
#include <cstdio>
#include <cstring>

namespace {

std::atomic<bool> g_visible{true};
std::atomic<int> g_ping_ms{-1};

std::atomic<uint32_t> g_ping_token{0};
std::atomic<uint64_t> g_ping_sent_tick{0};

std::atomic<int> g_unloading{0};

IDirect3DStateBlock9* g_state_block = nullptr;

std::atomic<int> g_bg_remaining_sec{-1};
std::atomic<int> g_bg_survived_red{-1};
std::atomic<int> g_bg_survived_blue{-1};

HFONT g_font = nullptr;
HDC g_hdc_screen = nullptr;
HDC g_hdc_mem = nullptr;
HBITMAP g_dib = nullptr;
void* g_dib_bits = nullptr;
int g_dib_w = 0;
int g_dib_h = 0;

LARGE_INTEGER g_qpc_freq{};
LARGE_INTEGER g_last_frame_qpc{};
float g_fps_smooth = 0.0f;

void EnsureFont() {
	if (g_font != nullptr)
		return;
	g_font = CreateFontA(
		17,
		0,
		0,
		0,
		FW_SEMIBOLD,
		FALSE,
		FALSE,
		FALSE,
		ANSI_CHARSET,
		OUT_DEFAULT_PRECIS,
		CLIP_DEFAULT_PRECIS,
		CLEARTYPE_QUALITY,
		VARIABLE_PITCH,
		"Tahoma");
}

void EnsureDib(int w, int h) {
	EnsureFont();
	const int need_w = (std::max)(w, 4);
	const int need_h = (std::max)(h, 4);
	if (g_hdc_mem != nullptr && need_w <= g_dib_w && need_h <= g_dib_h)
		return;

	if (g_dib) {
		DeleteObject(g_dib);
		g_dib = nullptr;
		g_dib_bits = nullptr;
	}
	if (g_hdc_mem) {
		DeleteDC(g_hdc_mem);
		g_hdc_mem = nullptr;
	}
	if (g_hdc_screen) {
		ReleaseDC(nullptr, g_hdc_screen);
		g_hdc_screen = nullptr;
	}

	g_hdc_screen = GetDC(nullptr);
	g_hdc_mem = CreateCompatibleDC(g_hdc_screen);
	g_dib_w = need_w;
	g_dib_h = need_h;

	BITMAPINFO bi = {};
	bi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
	bi.bmiHeader.biWidth = g_dib_w;
	bi.bmiHeader.biHeight = -g_dib_h;
	bi.bmiHeader.biPlanes = 1;
	bi.bmiHeader.biBitCount = 32;
	bi.bmiHeader.biCompression = BI_RGB;
	g_dib = CreateDIBSection(g_hdc_mem, &bi, DIB_RGB_COLORS, &g_dib_bits, nullptr, 0);
	SelectObject(g_hdc_mem, g_dib);
	SelectObject(g_hdc_mem, g_font);
}

void ReleaseStateBlock() {
	if (g_state_block) {
		g_state_block->Release();
		g_state_block = nullptr;
	}
}

void ReleaseGdi() {
	ReleaseStateBlock();
	if (g_dib) {
		DeleteObject(g_dib);
		g_dib = nullptr;
		g_dib_bits = nullptr;
	}
	if (g_hdc_mem) {
		DeleteDC(g_hdc_mem);
		g_hdc_mem = nullptr;
	}
	if (g_hdc_screen) {
		ReleaseDC(nullptr, g_hdc_screen);
		g_hdc_screen = nullptr;
	}
	if (g_font) {
		DeleteObject(g_font);
		g_font = nullptr;
	}
	g_dib_w = g_dib_h = 0;
}

void UpdateFps() {
	if (g_qpc_freq.QuadPart == 0) {
		QueryPerformanceFrequency(&g_qpc_freq);
		g_last_frame_qpc.QuadPart = 0;
	}
	LARGE_INTEGER now{};
	QueryPerformanceCounter(&now);
	if (g_last_frame_qpc.QuadPart != 0) {
		const double dt = static_cast<double>(now.QuadPart - g_last_frame_qpc.QuadPart) / static_cast<double>(g_qpc_freq.QuadPart);
		if (dt > 1e-6) {
			const float inst = static_cast<float>(1.0 / dt);
			if (g_fps_smooth <= 0.0f)
				g_fps_smooth = inst;
			else
				g_fps_smooth = g_fps_smooth * 0.92f + inst * 0.08f;
		}
	}
	g_last_frame_qpc = now;
}

bool RasterizeLine(const char* text, int* out_w, int* out_h) {
	if (!text || !out_w || !out_h)
		return false;
	EnsureFont();

	HDC hdc_measure = GetDC(nullptr);
	SelectObject(hdc_measure, g_font);
	SIZE sz{};
	if (GetTextExtentPoint32A(hdc_measure, text, static_cast<int>(strlen(text)), &sz) == 0) {
		ReleaseDC(nullptr, hdc_measure);
		return false;
	}
	ReleaseDC(nullptr, hdc_measure);

	const int pad = 6;
	const int tw = sz.cx + pad * 2;
	const int th = sz.cy + pad * 2;
	EnsureDib(tw, th);

	RECT rc = {0, 0, g_dib_w, g_dib_h};
	FillRect(g_hdc_mem, &rc, reinterpret_cast<HBRUSH>(GetStockObject(BLACK_BRUSH)));
	SetBkMode(g_hdc_mem, TRANSPARENT);
	SetTextColor(g_hdc_mem, RGB(235, 240, 255));

	RECT tr = {pad, pad, g_dib_w - pad, g_dib_h - pad};
	DrawTextA(g_hdc_mem, text, static_cast<int>(strlen(text)), &tr, DT_NOPREFIX | DT_LEFT | DT_TOP);

	auto* px = static_cast<unsigned char*>(g_dib_bits);
	for (int yy = 0; yy < g_dib_h; ++yy) {
		auto* row = reinterpret_cast<unsigned int*>(px + yy * g_dib_w * 4);
		for (int xx = 0; xx < g_dib_w; ++xx) {
			const unsigned int c = row[xx];
			const unsigned int b = c & 0xFFu;
			const unsigned int g = (c >> 8) & 0xFFu;
			const unsigned int r = (c >> 16) & 0xFFu;
			if (r + g + b < 20)
				row[xx] = 0u;
			else
				row[xx] = 0xFF000000u | r | (g << 8) | (b << 16);
		}
	}

	*out_w = tw;
	*out_h = th;
	return true;
}

void DrawQuad(IDirect3DDevice9* dev, float x, float y, float w, float h, IDirect3DTexture9* tex, float u2, float v2) {
	struct Vtx {
		float x, y, z, rhw;
		float u, v;
		DWORD diffuse;
	};
	const DWORD fvf = D3DFVF_XYZRHW | D3DFVF_TEX1 | D3DFVF_DIFFUSE;
	const DWORD col = 0xFFFFFFFF;
	Vtx v[4] = {
		{x, y, 0, 1, 0, 0, col},
		{x + w, y, 0, 1, u2, 0, col},
		{x, y + h, 0, 1, 0, v2, col},
		{x + w, y + h, 0, 1, u2, v2, col},
	};

	dev->SetFVF(fvf);
	dev->SetTexture(0, tex);
	dev->SetRenderState(D3DRS_ALPHABLENDENABLE, TRUE);
	dev->SetRenderState(D3DRS_SRCBLEND, D3DBLEND_SRCALPHA);
	dev->SetRenderState(D3DRS_DESTBLEND, D3DBLEND_INVSRCALPHA);
	dev->SetTextureStageState(0, D3DTSS_COLOROP, D3DTOP_MODULATE);
	dev->SetTextureStageState(0, D3DTSS_COLORARG1, D3DTA_TEXTURE);
	dev->SetTextureStageState(0, D3DTSS_COLORARG2, D3DTA_DIFFUSE);
	dev->SetTextureStageState(0, D3DTSS_ALPHAOP, D3DTOP_MODULATE);
	dev->SetTextureStageState(0, D3DTSS_ALPHAARG1, D3DTA_TEXTURE);
	dev->SetTextureStageState(0, D3DTSS_ALPHAARG2, D3DTA_DIFFUSE);
	dev->SetSamplerState(0, D3DSAMP_MINFILTER, D3DTEXF_LINEAR);
	dev->SetSamplerState(0, D3DSAMP_MAGFILTER, D3DTEXF_LINEAR);
	dev->DrawPrimitiveUP(D3DPT_TRIANGLESTRIP, 2, v, sizeof(Vtx));
	dev->SetTexture(0, nullptr);
	dev->SetRenderState(D3DRS_ALPHABLENDENABLE, FALSE);
}

} // namespace

void HudInit() {
	g_visible = true;
	g_ping_ms = -1;
	g_ping_token = 0;
	g_ping_sent_tick = 0;
	g_unloading = 0;
	g_fps_smooth = 0.0f;
	g_last_frame_qpc.QuadPart = 0;
	g_bg_remaining_sec = -1;
	g_bg_survived_red = -1;
	g_bg_survived_blue = -1;
	EnsureFont();
}

void HudShutdown() {
	g_unloading.store(1, std::memory_order_release);
	ReleaseGdi();
}

void HudSetBgState(int remaining_sec, int survived_red, int survived_blue) {
	g_bg_remaining_sec.store(remaining_sec, std::memory_order_relaxed);
	g_bg_survived_red.store(survived_red, std::memory_order_relaxed);
	g_bg_survived_blue.store(survived_blue, std::memory_order_relaxed);
}

void HudOnLostDevice() {
	ReleaseGdi();
}

void HudOnResetDevice() {
	EnsureFont();
}

void HudOnEndScene(IDirect3DDevice9* device) {
	if (g_unloading.load(std::memory_order_acquire) != 0)
		return;
	if (!g_visible.load())
		return;
	if (device == nullptr)
		return;

	UpdateFps();

	bool have_capture = false;
	if (g_state_block == nullptr)
		device->CreateStateBlock(D3DSBT_ALL, &g_state_block);
	if (g_state_block != nullptr && SUCCEEDED(g_state_block->Capture()))
		have_capture = true;
	if (!have_capture)
		return;

	char line[192] = {};
	const int ping = g_ping_ms.load();
	const int rem = g_bg_remaining_sec.load(std::memory_order_relaxed);
	const int red = g_bg_survived_red.load(std::memory_order_relaxed);
	const int blue = g_bg_survived_blue.load(std::memory_order_relaxed);

	const bool have_bg = rem >= 0 && red >= 0 && blue >= 0;
	if (have_bg) {
		const int mm = rem / 60;
		const int ss = rem % 60;
		if (ping >= 0)
			std::snprintf(
				line,
				sizeof(line),
				"Tempo: %02d:%02d  |  Vivos (R:%d  B:%d)  |  FPS: %.0f  Ping: %dms",
				mm,
				ss,
				red,
				blue,
				static_cast<double>(g_fps_smooth),
				ping);
		else
			std::snprintf(
				line,
				sizeof(line),
				"Tempo: %02d:%02d  |  Vivos (R:%d  B:%d)  |  FPS: %.0f  Ping: --",
				mm,
				ss,
				red,
				blue,
				static_cast<double>(g_fps_smooth));
	} else {
		if (ping >= 0)
			std::snprintf(line, sizeof(line), "FPS: %.0f  |  Ping: %d ms", static_cast<double>(g_fps_smooth), ping);
		else
			std::snprintf(line, sizeof(line), "FPS: %.0f  |  Ping: --", static_cast<double>(g_fps_smooth));
	}

	int tw = 0, th = 0;
	if (!RasterizeLine(line, &tw, &th))
		return;

	IDirect3DTexture9* tex = nullptr;
	if (FAILED(device->CreateTexture(tw, th, 1, 0, D3DFMT_A8R8G8B8, D3DPOOL_MANAGED, &tex, nullptr)))
		return;

	D3DLOCKED_RECT lr{};
	if (FAILED(tex->LockRect(0, &lr, nullptr, 0))) {
		tex->Release();
		return;
	}
	auto* src = static_cast<const unsigned char*>(g_dib_bits);
	for (int y = 0; y < th; ++y)
		std::memcpy(static_cast<unsigned char*>(lr.pBits) + y * lr.Pitch, src + y * g_dib_w * 4, static_cast<size_t>(tw * 4));
	tex->UnlockRect(0);

	const float draw_w = static_cast<float>(tw);
	const float draw_h = static_cast<float>(th);
	const float x = 8.0f;
	const float y = 8.0f;

	DrawQuad(device, x, y, draw_w, draw_h, tex, 1.0f, 1.0f);
	tex->Release();

	if (have_capture)
		g_state_block->Apply();
}

extern "C" {

__declspec(dllexport) int RostarsHud_Load() {
	// Kept for compatibility with loaders expecting a "Load" entrypoint.
	// DllMain already installs hooks; return non-zero to signal success.
	return 1;
}

__declspec(dllexport) void RostarsHud_SetVisible(int visible) {
	g_visible = (visible != 0);
}

__declspec(dllexport) void RostarsHud_ToggleVisible() {
	g_visible = !g_visible.load();
}

__declspec(dllexport) void RostarsHud_SetPing(int ping_ms) {
	g_ping_ms = ping_ms;
}

__declspec(dllexport) void RostarsHud_PingSent(unsigned int token) {
	g_ping_token.store(token, std::memory_order_relaxed);
	g_ping_sent_tick.store(GetTickCount64(), std::memory_order_relaxed);
}

__declspec(dllexport) void RostarsHud_PingAck(unsigned int token) {
	const uint32_t pending = g_ping_token.load(std::memory_order_relaxed);
	if (pending != token)
		return;
	const uint64_t t0 = g_ping_sent_tick.load(std::memory_order_relaxed);
	const uint64_t now = GetTickCount64();
	const int rtt = static_cast<int>((now >= t0) ? (now - t0) : 0);
	g_ping_ms.store(rtt, std::memory_order_relaxed);
}

} // extern "C"

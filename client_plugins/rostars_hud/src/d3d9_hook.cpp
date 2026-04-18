#include "d3d9_hook.hpp"

#include "hud.hpp"

#include <d3d9.h>

#include <atomic>
#include <cstdint>

extern "C" void RostarsHud_ToggleVisible();

#pragma comment(lib, "d3d9.lib")

namespace {

using EndSceneFn = HRESULT(__stdcall*)(IDirect3DDevice9*);
using ResetFn = HRESULT(__stdcall*)(IDirect3DDevice9*, D3DPRESENT_PARAMETERS*);

void** g_device_vtable = nullptr;
EndSceneFn g_orig_endscene = nullptr;
ResetFn g_orig_reset = nullptr;

constexpr std::uintptr_t kIdxReset = 16;
constexpr std::uintptr_t kIdxEndScene = 42;

std::atomic<int> g_hook_unload{0};

bool PatchVtable(void** vtable, std::uintptr_t index, void* replacement, void** out_original) {
	if (vtable == nullptr || replacement == nullptr || out_original == nullptr)
		return false;
	void* const target = vtable[index];
	if (target == nullptr || target == replacement)
		return false;
	DWORD old_protect = 0;
	void* slot = &vtable[index];
	if (VirtualProtect(slot, sizeof(void*), PAGE_EXECUTE_READWRITE, &old_protect) == 0)
		return false;
	*out_original = target;
	vtable[index] = replacement;
	VirtualProtect(slot, sizeof(void*), old_protect, &old_protect);
	return true;
}

void RestoreVtableSlot(void** vtable, std::uintptr_t index, void* original) {
	if (vtable == nullptr || original == nullptr)
		return;
	DWORD old_protect = 0;
	void* slot = &vtable[index];
	if (VirtualProtect(slot, sizeof(void*), PAGE_EXECUTE_READWRITE, &old_protect) == 0)
		return;
	vtable[index] = original;
	VirtualProtect(slot, sizeof(void*), old_protect, &old_protect);
}

HRESULT __stdcall HookReset(IDirect3DDevice9* device, D3DPRESENT_PARAMETERS* presentation_parameters) {
	HudOnLostDevice();
	const HRESULT hr = g_orig_reset(device, presentation_parameters);
	HudOnResetDevice();
	return hr;
}

HRESULT __stdcall HookEndScene(IDirect3DDevice9* device) {
	if (g_hook_unload.load(std::memory_order_acquire) != 0) {
		return g_orig_endscene(device);
	}

	static bool home_was_down = false;
	const bool home_down = (GetAsyncKeyState(VK_HOME) & 0x8000) != 0;
	if (home_down && !home_was_down)
		RostarsHud_ToggleVisible();
	home_was_down = home_down;

	static LARGE_INTEGER freq{};
	static LARGE_INTEGER last_es{};
	if (freq.QuadPart == 0)
		QueryPerformanceFrequency(&freq);
	LARGE_INTEGER now{};
	QueryPerformanceCounter(&now);
	if (freq.QuadPart != 0 && last_es.QuadPart != 0) {
		const std::int64_t dt_us = (now.QuadPart - last_es.QuadPart) * 1000000 / freq.QuadPart;
		constexpr std::int64_t kSameFrameDuplicateMaxUs = 400;
		if (dt_us >= 0 && dt_us < kSameFrameDuplicateMaxUs)
			return g_orig_endscene(device);
	}
	last_es = now;

	const HRESULT hr = g_orig_endscene(device);
	if (g_hook_unload.load(std::memory_order_acquire) == 0) {
		__try {
			HudOnEndScene(device);
		} __except (EXCEPTION_EXECUTE_HANDLER) {
		}
	}
	return hr;
}

} // namespace

bool D3d9HookInstall() {
	if (g_orig_endscene != nullptr)
		return true;

	HMODULE mod = GetModuleHandleA("d3d9.dll");
	if (mod == nullptr)
		mod = LoadLibraryA("d3d9.dll");
	if (mod == nullptr)
		return false;

	auto* create9 = reinterpret_cast<IDirect3D9*(__stdcall*)(UINT)>(GetProcAddress(mod, "Direct3DCreate9"));
	if (create9 == nullptr)
		return false;

	IDirect3D9* d3d = create9(D3D_SDK_VERSION);
	if (d3d == nullptr)
		return false;

	WNDCLASSEXA wc = {sizeof(wc)};
	wc.lpfnWndProc = DefWindowProcA;
	wc.hInstance = GetModuleHandleA(nullptr);
	wc.lpszClassName = "RostarsHudD3DProbe";
	RegisterClassExA(&wc);
	HWND hwnd = CreateWindowExA(0, wc.lpszClassName, "", WS_POPUP, 0, 0, 1, 1, nullptr, nullptr, wc.hInstance, nullptr);

	D3DPRESENT_PARAMETERS pp = {};
	pp.Windowed = TRUE;
	pp.SwapEffect = D3DSWAPEFFECT_DISCARD;
	pp.hDeviceWindow = hwnd;
	pp.BackBufferFormat = D3DFMT_UNKNOWN;
	pp.BackBufferWidth = 1;
	pp.BackBufferHeight = 1;

	IDirect3DDevice9* dev = nullptr;
	HRESULT hr = d3d->CreateDevice(
		0,
		D3DDEVTYPE_HAL,
		hwnd,
		D3DCREATE_SOFTWARE_VERTEXPROCESSING | D3DCREATE_DISABLE_DRIVER_MANAGEMENT,
		&pp,
		&dev);
	if (FAILED(hr) || dev == nullptr) {
		hr = d3d->CreateDevice(0, D3DDEVTYPE_REF, hwnd, D3DCREATE_SOFTWARE_VERTEXPROCESSING, &pp, &dev);
	}
	if (FAILED(hr) || dev == nullptr) {
		DestroyWindow(hwnd);
		UnregisterClassA(wc.lpszClassName, wc.hInstance);
		d3d->Release();
		return false;
	}

	void** vtable = *reinterpret_cast<void***>(dev);
	g_device_vtable = vtable;

	void* orig_es = nullptr;
	void* orig_rs = nullptr;
	if (!PatchVtable(vtable, kIdxEndScene, reinterpret_cast<void*>(&HookEndScene), &orig_es)) {
		dev->Release();
		DestroyWindow(hwnd);
		UnregisterClassA(wc.lpszClassName, wc.hInstance);
		d3d->Release();
		g_device_vtable = nullptr;
		return false;
	}
	if (!PatchVtable(vtable, kIdxReset, reinterpret_cast<void*>(&HookReset), &orig_rs)) {
		RestoreVtableSlot(vtable, kIdxEndScene, orig_es);
		dev->Release();
		DestroyWindow(hwnd);
		UnregisterClassA(wc.lpszClassName, wc.hInstance);
		d3d->Release();
		g_device_vtable = nullptr;
		return false;
	}

	g_orig_endscene = reinterpret_cast<EndSceneFn>(orig_es);
	g_orig_reset = reinterpret_cast<ResetFn>(orig_rs);

	dev->Release();
	DestroyWindow(hwnd);
	UnregisterClassA(wc.lpszClassName, wc.hInstance);
	d3d->Release();
	return true;
}

void D3d9HookRemove() {
	g_hook_unload.store(1, std::memory_order_release);
	HudOnLostDevice();

	if (g_device_vtable != nullptr && g_orig_endscene != nullptr)
		RestoreVtableSlot(g_device_vtable, kIdxEndScene, reinterpret_cast<void*>(g_orig_endscene));
	if (g_device_vtable != nullptr && g_orig_reset != nullptr)
		RestoreVtableSlot(g_device_vtable, kIdxReset, reinterpret_cast<void*>(g_orig_reset));

	g_orig_endscene = nullptr;
	g_orig_reset = nullptr;
	g_device_vtable = nullptr;
}

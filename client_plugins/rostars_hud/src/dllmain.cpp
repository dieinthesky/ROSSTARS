#include "d3d9_hook.hpp"
#include "hud.hpp"
#include "net_sniff.hpp"

#include <Windows.h>

namespace {

DWORD WINAPI InitThread(LPVOID) {
	Sleep(800);
	NetSniffInstall();
	D3d9HookInstall();
	return 0;
}

} // namespace

BOOL APIENTRY DllMain(HMODULE module, DWORD reason, LPVOID) {
	(void)module;
	switch (reason) {
	case DLL_PROCESS_ATTACH:
		DisableThreadLibraryCalls(module);
		HudInit();
		CloseHandle(CreateThread(nullptr, 0, InitThread, nullptr, 0, nullptr));
		break;
	case DLL_PROCESS_DETACH:
		D3d9HookRemove();
		NetSniffRemove();
		HudShutdown();
		break;
	default:
		break;
	}
	return TRUE;
}

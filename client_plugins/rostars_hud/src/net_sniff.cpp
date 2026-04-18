#include "net_sniff.hpp"

#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#ifndef NOMINMAX
#define NOMINMAX
#endif
#ifndef _WINSOCKAPI_
#define _WINSOCKAPI_ // prevent windows.h from including winsock.h
#endif

#include <WinSock2.h>
#include <Windows.h>

#include "hud.hpp"

#include <atomic>
#include <cstdint>
#include <cstring>

#pragma comment(lib, "Ws2_32.lib")

namespace {

using RecvFn = int(WINAPI*)(SOCKET s, char* buf, int len, int flags);

RecvFn g_orig_recv = nullptr;
std::atomic<int> g_net_unload{0};

// A simple reassembly buffer; enough for our fixed-size custom packet (76 bytes).
unsigned char g_buf[4096] = {};
int g_buf_len = 0;

constexpr uint16_t kOpcodeHudBg = 0x7BFE;
constexpr int kPacketHudBgLen = 76;

uint16_t ReadU16LE(const unsigned char* p) {
	return static_cast<uint16_t>(p[0] | (static_cast<uint16_t>(p[1]) << 8));
}
uint32_t ReadU32LE(const unsigned char* p) {
	return static_cast<uint32_t>(p[0] | (static_cast<uint32_t>(p[1]) << 8) | (static_cast<uint32_t>(p[2]) << 16) |
		(static_cast<uint32_t>(p[3]) << 24));
}

void ConsumeBytes(int n) {
	if (n <= 0)
		return;
	if (n >= g_buf_len) {
		g_buf_len = 0;
		return;
	}
	std::memmove(g_buf, g_buf + n, static_cast<size_t>(g_buf_len - n));
	g_buf_len -= n;
}

void ProcessBuffer() {
	// Search for 0x7BFE and parse when 76 bytes available.
	// This avoids needing a full packet-length table and keeps NPC scripts untouched.
	for (;;) {
		if (g_buf_len < 2)
			return;
		int pos = -1;
		for (int i = 0; i + 1 < g_buf_len; ++i) {
			if (ReadU16LE(g_buf + i) == kOpcodeHudBg) {
				pos = i;
				break;
			}
		}
		if (pos < 0) {
			// keep last byte in case opcode splits across recv
			if (g_buf_len > 1)
				ConsumeBytes(g_buf_len - 1);
			return;
		}
		if (pos > 0)
			ConsumeBytes(pos);
		if (g_buf_len < kPacketHudBgLen)
			return;

		// 0x7BFE <flags>.W <remaining_sec>.L <survived_red>.W <survived_blue>.W ...
		const unsigned char* p = g_buf;
		const uint16_t flags = ReadU16LE(p + 2);
		(void)flags;
		const int remaining_sec = static_cast<int>(static_cast<int32_t>(ReadU32LE(p + 4)));
		const int survived_red = static_cast<int>(ReadU16LE(p + 8));
		const int survived_blue = static_cast<int>(ReadU16LE(p + 10));

		HudSetBgState(remaining_sec, survived_red, survived_blue);

		ConsumeBytes(kPacketHudBgLen);
	}
}

int WINAPI HookRecv(SOCKET s, char* buf, int len, int flags) {
	if (g_net_unload.load(std::memory_order_acquire) != 0)
		return g_orig_recv(s, buf, len, flags);

	const int ret = g_orig_recv(s, buf, len, flags);
	if (ret <= 0 || buf == nullptr)
		return ret;

	// Append to reassembly buffer (best-effort).
	const int space = static_cast<int>(sizeof(g_buf)) - g_buf_len;
	const int to_copy = (ret < space) ? ret : space;
	if (to_copy > 0) {
		std::memcpy(g_buf + g_buf_len, buf, static_cast<size_t>(to_copy));
		g_buf_len += to_copy;
		ProcessBuffer();
	} else {
		// overflow: reset buffer
		g_buf_len = 0;
	}
	return ret;
}

bool PatchIAT(HMODULE module, const char* imported_dll, const char* func_name, void* replacement, void** out_original) {
	if (!module || !imported_dll || !func_name || !replacement || !out_original)
		return false;

	auto* dos = reinterpret_cast<IMAGE_DOS_HEADER*>(module);
	if (dos->e_magic != IMAGE_DOS_SIGNATURE)
		return false;
	auto* nt = reinterpret_cast<IMAGE_NT_HEADERS*>(reinterpret_cast<unsigned char*>(module) + dos->e_lfanew);
	if (nt->Signature != IMAGE_NT_SIGNATURE)
		return false;

	const DWORD rva = nt->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_IMPORT].VirtualAddress;
	if (rva == 0)
		return false;
	auto* imp = reinterpret_cast<IMAGE_IMPORT_DESCRIPTOR*>(reinterpret_cast<unsigned char*>(module) + rva);

	for (; imp->Name != 0; ++imp) {
		const char* dll_name = reinterpret_cast<const char*>(reinterpret_cast<unsigned char*>(module) + imp->Name);
		if (_stricmp(dll_name, imported_dll) != 0)
			continue;

		auto* thunk = reinterpret_cast<IMAGE_THUNK_DATA*>(reinterpret_cast<unsigned char*>(module) + imp->FirstThunk);
		auto* orig_thunk = reinterpret_cast<IMAGE_THUNK_DATA*>(reinterpret_cast<unsigned char*>(module) + imp->OriginalFirstThunk);

		for (; thunk->u1.Function != 0; ++thunk, ++orig_thunk) {
			if ((orig_thunk->u1.Ordinal & IMAGE_ORDINAL_FLAG) != 0)
				continue;

			auto* ibn = reinterpret_cast<IMAGE_IMPORT_BY_NAME*>(reinterpret_cast<unsigned char*>(module) + orig_thunk->u1.AddressOfData);
			const char* name = reinterpret_cast<const char*>(ibn->Name);
			if (std::strcmp(name, func_name) != 0)
				continue;

			DWORD old_protect = 0;
			if (VirtualProtect(&thunk->u1.Function, sizeof(void*), PAGE_EXECUTE_READWRITE, &old_protect) == 0)
				return false;
			*out_original = reinterpret_cast<void*>(static_cast<uintptr_t>(thunk->u1.Function));
			thunk->u1.Function = reinterpret_cast<ULONG_PTR>(replacement);
			VirtualProtect(&thunk->u1.Function, sizeof(void*), old_protect, &old_protect);
			return true;
		}
	}
	return false;
}

} // namespace

bool NetSniffInstall() {
	if (g_orig_recv != nullptr)
		return true;

	HMODULE exe = GetModuleHandleA(nullptr);
	void* orig = nullptr;
	if (!PatchIAT(exe, "WS2_32.dll", "recv", reinterpret_cast<void*>(&HookRecv), &orig)) {
		// some clients import WSOCK32.dll instead
		if (!PatchIAT(exe, "WSOCK32.dll", "recv", reinterpret_cast<void*>(&HookRecv), &orig))
			return false;
	}
	g_orig_recv = reinterpret_cast<RecvFn>(orig);
	g_net_unload.store(0, std::memory_order_release);
	g_buf_len = 0;
	return true;
}

void NetSniffRemove() {
	g_net_unload.store(1, std::memory_order_release);
	// Not restoring IAT here (minimal); detach will unload anyway.
	g_orig_recv = nullptr;
	g_buf_len = 0;
}


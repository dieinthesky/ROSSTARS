#pragma once

#include <d3d9.h>

void HudInit();
void HudShutdown();
void HudOnEndScene(IDirect3DDevice9* device);
void HudOnLostDevice();
void HudOnResetDevice();

// BG HUD state (fed by packet sniffer; no NPC changes required).
void HudSetBgState(int remaining_sec, int survived_red, int survived_blue);

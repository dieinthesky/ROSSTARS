# rostars_hud (Win32, do zero)

DLL mínima: **FPS** + **ping** no canto superior esquerdo, desenho após o `EndScene` do Direct3D 9. Sem D3DX, sem zlib, sem sniff de pacotes — só `d3d9.lib`.

## Build

- Visual Studio 2022 (ou outro com toolset **v143** / ajuste o `.vcxproj`).
- Plataforma **Win32** (x86), igual ao cliente clássico.
- Saída: `bin/Release/rostars_hud.dll` (ou `bin/Debug/`).

## Carregar no cliente

- O patch habitual (ex.: Nemo “custom DLL”) deve apontar para esta DLL; se o patch esperava outro nome, renomeie a saída ou ajuste o patch.

## Uso

- **HOME**: mostra / esconde o HUD.
- **Ping manual (teste):** chame `RostarsHud_SetPing(ms)` a partir de outro módulo que faça `GetProcAddress`.
- **Ping RTT (recomendado):** antes de enviar o pedido de ping, `RostarsHud_PingSent(token)`; ao receber o ack com o mesmo token, `RostarsHud_PingAck(token)`.

Exports (`rostars_hud.def`):

- `RostarsHud_SetVisible(int)`
- `RostarsHud_ToggleVisible`
- `RostarsHud_SetPing`
- `RostarsHud_PingSent`
- `RostarsHud_PingAck`

## Ragnarok UI Designer (ui.divine-pride.net)

Arrasta um destes para [ui.divine-pride.net](https://ui.divine-pride.net/):

| Ficheiro | Conteúdo |
|----------|----------|
| `designer/rostars_fps_ping_hud.json` | HUD mínimo só com texto FPS \| Ping |
| `designer/rostars_hud_bg_survived.json` | Painel estilo BG: barra escura no topo (FPS \| Ping), faixa vermelha e azul com losango (♦) e badge **survived** |

Edita no browser e usa **Export JSON**. Cantos muito arredondados e ícones em bitmap dependem do client; aqui usamos cores + texto. Esse layout **não** liga sozinho à DLL: o cliente teria de carregar o JSON e atualizar os `CUIStaticText` — a DLL `rostars_hud` continua como overlay D3D até haver integração no EXE.

## Servidor

Integração de pacotes custom com o map-server (se existir) fica à parte desta pasta; esta DLL não inclui sniff nem parsing de tráfego.

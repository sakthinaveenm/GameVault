# Controller Subsystem & Navigation

## Overview
Universal Game Hub provides a 10-foot console-like user interface with full gamepad navigation support across all screens.

## Supported Controllers
- **Xbox**: Xbox Wireless Controller, Xbox Elite, Xbox 360/One (XInput).
- **PlayStation**: DualSense (PS5), DualShock 4 (PS4).
- **Nintendo**: Switch Pro Controller.
- **Generic**: Standard SDL2 / W3C standard gamepad mappings.

## Standard Control Scheme

| Physical Input | Primary Action | Context Action |
|---|---|---|
| **D-Pad / Left Stick** | Grid & Menu Navigation | Card focus shifting |
| **A / Cross (Button 0)** | Confirm / Select | Launch focused game |
| **B / Circle (Button 1)** | Back / Cancel | Dismiss modal / Return |
| **X / Square (Button 2)** | Quick Action | Toggle Favorite / Filter |
| **Y / Triangle (Button 3)** | Options / Search | Open Game Details Options |
| **Left Bumper (LB / L1)** | Previous Tab / Category | Switch views left |
| **Right Bumper (RB / R1)**| Next Tab / Category | Switch views right |
| **Start / Options** | Quick Menu | Global launcher menu |
| **Back / View** | Profile Menu | Switch active profile |

## Architecture & Conflict Prevention
1. **Frontend Gamepad Poller**: Utilizes `navigator.getGamepads()` with a `requestAnimationFrame` polling loop and dead-zone filtering (default 0.25).
2. **Debouncing & Repeat Acceleration**: Analog stick and D-pad triggers employ a 180ms debounce on initial movement followed by continuous repeat every 120ms if held.
3. **Double Input Prevention**: Frontend listens to physical gamepad events exclusively when focused; keyboard inputs (Arrow keys, Enter, Escape) work interchangeably without event duplication.


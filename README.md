# Hotkey Capture Plugin for Obsidian

A plugin for capturing and inserting hotkeys into your notes.

## Usage

1. Open Obsidian hotkey settings and assign a hotkey that will be used to capture
2. Press this hotkey to enter capture mode (or via Command Palette: "Start capturing hotkey")
3. Press the desired keys — they are displayed in the status bar
4. Press **Esc** to finish and insert the result at the cursor position. 
Esc can be changed to other hotkey in plugin settings.  

## Examples

| Input | Result |
|-------|--------|
| Ctrl+E, then T | `Ctrl+E, T` |
| Ctrl+Shift+P | `Ctrl+Shift+P` |
| Alt+F4 | `Alt+F4` |
| Arrow Up | `↑` |

## Features

- Modifier support: Ctrl, Alt, Shift, Win
- Key sequence support (comma-separated)
- Visual indicator in the status bar
- Special keys displayed in a readable format (Space, Enter, arrows, etc.)

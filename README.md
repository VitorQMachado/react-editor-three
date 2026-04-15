# React Editor Three

Unity-inspired game scene editor built with React and Three.js.

This project provides a browser-based editor workflow similar to a lightweight Unity-style inspector:

- Scene viewport powered by Three.js
- Hierarchy and inspector panels
- GameObject and Component editing
- Project-based JSON load/save
- Runtime texture remapping from local files

## Overview

React Editor Three is designed for fast iteration on game scenes in the browser. It combines:

- React UI for editor tooling
- Three.js rendering through `@vmlibs/unit_three`
- JSON serialization for scene persistence
- Local file system integration for loading/saving project data

The editor follows common game engine patterns:

- Hierarchy (Game Objects list)
- Inspector (Component properties)
- Scene controls (move/rotate/scale, FPS toggle)

## Main Features

- New Project workflow with project name + folder selection
- Load Project / Save Project actions from the File menu
- Auto-load support using previously granted folder access
- Inspector editing for components such as:
	- Mesh
	- Light
	- Skybox
	- Collider
	- RigidBody
- Texture reference preservation in JSON (stores paths, not runtime blob URLs)
- Skybox texture editing from inspector
- Rotation editing in degrees in the inspector UI

## Tech Stack

- React 19
- TypeScript
- Three.js (via `@vmlibs/unit_three`)
- Create React App toolchain

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run in Development

```bash
npm start
```

By default, the app runs on:

- http://localhost:3001

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm test
```

## Project Structure

```text
src/
	components/
		Editor/
		GameScreen/
		Sidebar/
		Lists/
		GameObjectComponents/
	services/
	utils/
```

Key areas:

- `components/Editor`: main editor shell
- `components/GameScreen`: Three.js viewport bootstrap
- `components/Sidebar`: file/actions, inspector, hierarchy
- `services`: load/save and file-system handling

## How Persistence Works

- Scenes are saved as JSON maps of GameObjects and Components.
- Texture values are stored as file references in JSON.
- During load, references are remapped to browser object URLs for runtime rendering.

This keeps saved data portable while preserving live rendering behavior.

## Roadmap Ideas

- Undo/redo stack
- Prefab support
- Better material editor
- Scene gizmo improvements
- Play mode simulation controls

## Contributing

Contributions are welcome. Please open an issue or submit a PR with a clear description of the change.

## Author

Vitor de Queiroz Machado


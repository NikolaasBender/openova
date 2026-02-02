# Design Document: VS Code Clone (Electron + Monaco)

## 1. Overview
The goal is to build a lightweight code editor that mimics the look and feel of Visual Studio Code. It will be built using Electron for the desktop runtime and Monaco Editor for the core editing experience.

## 2. Architecture

### 2.1 Core Components
- **Main Process (Node.js)**
    - Handles application lifecycle.
    - Native file system operations (read, write, list directories).
    - Native application menus.
    - Inter-Process Communication (IPC) handlers.
- **Renderer Process (Web)**
    - Built with React (for component-based UI).
    - **Monaco Editor**: The heart of the application for code editing.
    - **UI Layout**:
        - **Activity Bar**: Leftmost strip (Icons for Explorer, Search, etc.).
        - **Side Bar**: File explorer / Tree view.
        - **Editor Group**: Main area hosting Monaco instances.
        - **Status Bar**: Bottom strip for info (Cursor position, language, etc.).

### 2.2 Tech Stack
- **Framework**: Electron
- **Frontend**: React + TypeScript
- **Bundler**: Vite (for fast HMR and build)
- **Styling**: TailwindCSS (configured with VS Code color tokens)
- **Editor**: `@monaco-editor/react`

## 3. IPC API Design
- `dialog:openFolder`: Triggers native folder picker.
- `fs:readDirectory(path)`: Returns list of files/folders.
- `fs:readFile(path)`: Returns file content.

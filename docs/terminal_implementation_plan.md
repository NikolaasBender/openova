# Terminal Integration Plan

This document outlines the plan to add a fully functional terminal to the OpenOva IDE, similar to VS Code.

## 1. Dependencies

We will need to install the following packages:

-   **xterm**: The frontend terminal component.
-   **xterm-addon-fit**: To make the terminal resize correctly within its container.
-   **node-pty**: (Native dependency) To spawn and manage the shell process in the backend.

```bash
npm install xterm xterm-addon-fit
npm install node-pty --save-optional # Native module, may require build tools
```

## 2. Architecture

The terminal will function by communicating between the **Renderer Process** (UI) and the **Main Process** (System) via Electron's IPC (Inter-Process Communication).

-   **Renderer (xterm.js)**: Captures user input and sends it to Main. Receives output from Main and displays it.
-   **Main (node-pty)**: Spawns the system shell (bash/zsh/powershell). Receives input from Renderer and writes to shell. Receives output from shell and sends to Renderer.

## 3. Implementation Steps

### Step A: Main Process (`src/main/main.ts`)

1.  **Import `node-pty`**: Dynamic import or require to handle native loading.
2.  **Manage PTY Sessions**: Create a storage (e.g., a Map) to hold active terminal sessions.
3.  **IPC Handlers**:
    -   `terminal:create`: Spawns a new pty process. Returns the process ID (pid).
    -   `terminal:write`: Accepts data from the renderer and writes it to the specific pty process.
    -   `terminal:resize`: Accepts cols/rows and resizes the pty process.
    -   `terminal:dispose`: Kills the process.
4.  **Data Forwarding**: Listen to the pty's 'data' event and send it to the renderer via `webContents.send('terminal:incoming', data)`.

### Step B: Preload Script (`src/main/preload.ts`)

Expose a secure API to the renderer via `contextBridge`:

```typescript
// Example API structure
contextBridge.exposeInMainWorld('electronAPI', {
  terminal: {
    create: () => ipcRenderer.invoke('terminal:create'),
    onIncoming: (callback) => ipcRenderer.on('terminal:incoming', callback),
    write: (data) => ipcRenderer.send('terminal:write', data),
    resize: (cols, rows) => ipcRenderer.send('terminal:resize', { cols, rows })
  }
})
```

### Step C: Renderer Component (`src/renderer/components/TerminalPane.tsx`)

1.  Create a new React component `TerminalPane`.
2.  **Initialize xterm**:
    -   Create `Terminal` instance.
    -   Load `FitAddon`.
    -   Attach to a DOM element (ref).
3.  **Connect Logic**:
    -   Call `window.electronAPI.terminal.create()` on mount.
    -   `term.onData(data => ...)` -> send to main.
    -   `window.electronAPI.terminal.onIncoming(data => ...)` -> `term.write(data)`.
4.  **Styling**: Ensure the container has a fixed height or flex-grow logic to simulate a bottom panel.

### Step D: UI Integration (`src/renderer/App.tsx`)

1.  Add a "Panel" area to the main layout (usually at the bottom).
2.  Implement a toggle (View -> Terminal) or a layout splitter to show/hide the `TerminalPane`.

## 4. Verification

1.  **Verify Shell**: Ensure the correct shell (bash/zsh) spawns based on the OS.
2.  **Verify Input/Output**: Typing `ls` should show the file listing.
3.  **Verify Resizing**: Resizing the window should resize the terminal text flow (requires `FitAddon.fit()` call on window resize).
4.  **Build**: Ensure `node-pty` compiles correctly during `npm run build` / native rebuilding may be required.

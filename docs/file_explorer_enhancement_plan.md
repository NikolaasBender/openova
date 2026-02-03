# File Explorer Enhancement Plan

This document outlines the plan to update the File Explorer UI to allow creating files and directories, and to ensure the file list refreshes automatically when changes occur.

## Goals
1.  **Create Files & Directories**: Allow users to create new files and folders directly from the sidebar.
2.  **Auto-Refresh**: Immediately reflect file system changes (created/deleted/renamed files) in the sidebar without manual refresh.

## 1. Backend Changes (`src/main/main.ts`)

We need to add IPC handlers for file modification and watching.

### Dependencies
-   Add `chokidar` to `dependencies` for robust cross-platform file watching.
    -   `npm install chokidar`

### IPC Handlers to Add
-   `fs:createFile(path: string, content: string = '')`: Creates a new empty file.
-   `fs:createDirectory(path: string)`: Creates a new directory.
-   `fs:watch(path: string)`: Starts watching a directory for changes.
-   `fs:unwatch(path: string)`: Stops watching.

### Watching Logic
-   When `fs:watch` is called, use `chokidar.watch(path)` to monitor the directory.
-   On events (`add`, `unlink`, `addDir`, `unlinkDir`), emit an event to the renderer: `fs:changed`.
-   The renderer will listen for `fs:changed` and trigger a refresh of the file list.
-   Maintain a map of active watchers to avoid duplicates and allow unwatching.

## 2. Frontend Changes (`src/renderer/components/ExplorerPane.tsx`)

### UI Updates
-   **Header Actions**: Add icons/buttons in the Explorer header (`ExplorerPane` top bar) for:
    -   "New File" (e.g., `+` icon or specific file icon)
    -   "New Folder" (e.g., folder icon with `+`)
    -   "Refresh" (optional manual trigger)

### Interaction Logic
-   **New File/Folder Flow**:
    1.  User clicks "New File" or "New Folder".
    2.  Show a temporary input field in the file list (either at the top or inside the selected folder).
    3.  User types name and presses Enter.
    4.  Call `window.electronAPI.createFile` or `createDirectory`.
    5.  Handle errors (e.g., file exists).
    
    *Simplified MVP*: Use a simple `window.prompt` or a modal first if inline editing is too complex for this iteration, but inline is preferred for a good UX.

-   **Auto-Refresh**:
    1.  When a root folder is opened, call `window.electronAPI.watch(rootPath)`.
    2.  Listen for `fs:changed` events.
    3.  On event, re-fetch the file list (`readDirectory`).
    4.  Clean up: Call `unwatch` when the component unmounts or root path changes.

## 3. Preload Script (`src/preload/index.ts` or `src/main/preload.ts`)

-   Expose the new `fs` methods in the `electronAPI` context bridge.
    -   `createFile: (path) => ipcRenderer.invoke('fs:createFile', path)`
    -   `createDirectory: (path) => ipcRenderer.invoke('fs:createDirectory', path)`
    -   `watch: (path) => ipcRenderer.send('fs:watch', path)` (or invoke if we need confirmation)
    -   `onFileChange: (callback) => ipcRenderer.on('fs:changed', callback)`

## Implementation Steps

1.  **Install `chokidar`**.
2.  **Update `src/main/main.ts`**: Implement `createFile`, `createDirectory`, and `watch` handlers.
3.  **Update `src/main/preload.ts`**: Expose new API methods.
4.  **Update `src/renderer/components/ExplorerPane.tsx`**:
    -   Implement `useEffect` to hook up the watcher.
    -   Add UI buttons for creation.
    -   Implement creation logic (UI input + API call).

## Usage Example (Draft Code)

```typescript
// main.ts
ipcMain.handle('fs:createFile', async (_, filePath) => {
    await fs.writeFile(filePath, '');
});

// ExplorerPane.tsx
useEffect(() => {
    if (rootPath) {
        window.electronAPI.watch(rootPath);
        const removeListener = window.electronAPI.onFileChange(() => {
            refreshFiles(); // calls readDirectory
        });
        return () => {
             // cleanup
             removeListener();
        };
    }
}, [rootPath]);
```

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('dialog:openFolder'),
    readDirectory: (path: string) => ipcRenderer.invoke('fs:readDirectory', path),
    getAllFiles: (path: string) => ipcRenderer.invoke('fs:getAllFiles', path),
    readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    terminal: {
        create: (cwd?: string) => ipcRenderer.invoke('terminal:create', cwd),
        onIncoming: (callback: (data: { pid: number; data: string }) => void) => {
            const subscription = (_: any, data: { pid: number; data: string }) => callback(data);
            ipcRenderer.on('terminal:incoming', subscription);
            // Return cleanup function
            return () => ipcRenderer.removeListener('terminal:incoming', subscription);
        },
        write: (pid: number, data: string) => ipcRenderer.send('terminal:write', { pid, data }),
        resize: (pid: number, cols: number, rows: number) => ipcRenderer.send('terminal:resize', { pid, cols, rows }),
        dispose: (pid: number) => ipcRenderer.send('terminal:dispose', { pid }),
    },
    checkDevContainer: (projectPath: string) => ipcRenderer.invoke('devcontainer:check', projectPath),
    startDevContainer: (projectPath: string, config: any, options?: any) => ipcRenderer.invoke('devcontainer:up', projectPath, config, options),
    searchExtensions: (query: string) => ipcRenderer.invoke('extensions:search', query),
    log: (message: string) => ipcRenderer.send('app:log', message),
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
});

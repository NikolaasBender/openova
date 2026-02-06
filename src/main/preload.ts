import { contextBridge, ipcRenderer } from 'electron';

console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
console.log('!!! PRELOAD STARTUP CHECKPOINT - IF YOU SEE THIS, PRELOAD IS RUNNING !!!');
console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
ipcRenderer.send('app:log', '!!! PRELOAD EXECUTED !!!');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('dialog:openFolder'),
    readDirectory: (path: string) => ipcRenderer.invoke('fs:readDirectory', path),
    getAllFiles: (path: string) => ipcRenderer.invoke('fs:getAllFiles', path),
    readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
    createFile: (path: string, content?: string) => ipcRenderer.invoke('fs:createFile', path, content),
    createDirectory: (path: string) => ipcRenderer.invoke('fs:createDirectory', path),
    watch: (path: string) => ipcRenderer.invoke('fs:watch', path),
    unwatch: (path: string) => ipcRenderer.invoke('fs:unwatch', path),
    onFileChange: (callback: (data: { event: string; path: string }) => void) => {
        const subscription = (_: any, data: { event: string; path: string }) => {
            console.log(`[CHECKPOINT 5] Preload received 'fs:changed':`, data);
            callback(data);
        };
        ipcRenderer.on('fs:changed', subscription);
        return () => ipcRenderer.removeListener('fs:changed', subscription);
    },
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
    onSettingsUpdate: (callback: (settings: any) => void) => {
        const subscription = (_: any, settings: any) => callback(settings);
        ipcRenderer.on('settings:updated', subscription);
        return () => ipcRenderer.removeListener('settings:updated', subscription);
    },
    platform: process.platform,
});

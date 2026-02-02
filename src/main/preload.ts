import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('dialog:openFolder'),
    readDirectory: (path: string) => ipcRenderer.invoke('fs:readDirectory', path),
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
    }
});

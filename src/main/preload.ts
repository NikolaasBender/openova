import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('dialog:openFolder'),
    readDirectory: (path: string) => ipcRenderer.invoke('fs:readDirectory', path),
    readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
});

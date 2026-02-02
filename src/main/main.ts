import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import * as pty from 'node-pty';
import { parseDevContainer, startDevContainer } from './devContainer';

// Fix for Linux SUID sandbox error
app.commandLine.appendSwitch('no-sandbox');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        titleBarStyle: 'hidden', // Custom title bar
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        backgroundColor: '#1e1e1e',
    });

    // Load the index.html from dist
    // If dev, load localhost
    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
        win.webContents.openDevTools();
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    // IPC Handlers
    ipcMain.handle('dialog:openFolder', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory'],
        });
        if (canceled) return null;
        return filePaths[0];
    });

    ipcMain.handle('devcontainer:check', async (_, projectPath) => {
        return parseDevContainer(projectPath);
    });

    // Dev Container State
    const projectContainers = new Map<string, string>();

    ipcMain.handle('devcontainer:up', async (_, projectPath, config) => {
        const id = await startDevContainer(projectPath, config);
        projectContainers.set(projectPath, id);
        return id;
    });

    ipcMain.handle('extensions:search', async (_, query) => {
        if (!query) return [];
        try {
            const response = await fetch(`https://open-vsx.org/api/-/search?query=${encodeURIComponent(query)}&size=20&sortBy=relevance&sortOrder=desc`);
            if (!response.ok) throw new Error(response.statusText);
            const data = await response.json();
            return data.extensions || [];
        } catch (error) {
            console.error('Extension search failed:', error);
            return [];
        }
    });

    ipcMain.handle('fs:readDirectory', async (_, dirPath) => {
        try {
            const files = await fs.readdir(dirPath, { withFileTypes: true });
            return files.map(file => ({
                name: file.name,
                isDirectory: file.isDirectory(),
                path: path.join(dirPath, file.name)
            }));
        } catch (error) {
            console.error('Error reading directory', error);
            return [];
        }
    });

    ipcMain.handle('fs:readFile', async (_, filePath) => {
        return fs.readFile(filePath, 'utf-8');
    });

    // Window Control Handlers
    ipcMain.on('window:minimize', () => {
        BrowserWindow.getFocusedWindow()?.minimize();
    });
    ipcMain.on('window:maximize', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            if (win.isMaximized()) win.unmaximize();
            else win.maximize();
        }
    });
    ipcMain.on('window:close', () => {
        BrowserWindow.getFocusedWindow()?.close();
    });

    // Terminal Handlers
    const ptyProcesses = new Map<number, any>();

    ipcMain.handle('terminal:create', (event, cwd?: string) => {
        let shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
        let args: string[] = [];
        let ptyCwd = cwd || os.homedir();

        // Check if we should spawn in a container
        if (cwd) {
            for (const [projectPath, containerId] of projectContainers) {
                if (cwd.startsWith(projectPath)) {
                    console.log(`Spawning terminal in container ${containerId} for ${cwd}`);
                    shell = 'docker';
                    args = ['exec', '-it', containerId, '/bin/sh'];
                    ptyCwd = '/workspace'; // Force workspace dir
                    break;
                }
            }
        }

        const ptyProcess = pty.spawn(shell, args, {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: ptyCwd,
            env: process.env as any
        });

        const pid = ptyProcess.pid;
        ptyProcesses.set(pid, ptyProcess);

        // Send data to renderer
        ptyProcess.onData((data) => {
            // We can send to the specific sender window
            // Payload: { pid, data }
            event.sender.send('terminal:incoming', { pid, data });
        });

        ptyProcess.onExit(() => {
            ptyProcesses.delete(pid);
            event.sender.send('terminal:exit', { pid });
        });

        return pid;
    });

    ipcMain.on('terminal:write', (event, { pid, data }) => {
        const ptyProcess = ptyProcesses.get(pid);
        if (ptyProcess) {
            ptyProcess.write(data);
        }
    });

    ipcMain.on('terminal:resize', (event, { pid, cols, rows }) => {
        const ptyProcess = ptyProcesses.get(pid);
        if (ptyProcess) {
            ptyProcess.resize(cols, rows);
        }
    });

    ipcMain.on('terminal:dispose', (event, { pid }) => {
        const ptyProcess = ptyProcesses.get(pid);
        if (ptyProcess) {
            ptyProcess.kill();
            ptyProcesses.delete(pid);
        }
    });

});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

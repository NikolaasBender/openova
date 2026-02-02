import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import * as pty from 'node-pty';

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
        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

        // Use provided cwd or default to home
        const ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: cwd || os.homedir(),
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

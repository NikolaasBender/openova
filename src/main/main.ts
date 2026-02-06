import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import * as pty from 'node-pty';
import { parseDevContainer, startDevContainer } from './devContainer';
import { SettingsManager } from './settings';
import chokidar, { FSWatcher } from 'chokidar';

// Fix for Linux SUID sandbox error
// Helper for file logging
function logToFile(msg: string) {
    const logPath = '/tmp/openova-debug.log';
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${msg}\n`;
    // Use sync write to ensure it hits disk immediately
    try {
        // dynamic require fs if needed or just use the imported fs (it is fs/promises)
        // We need sync for immediate debugging safety, but promises is imported.
        // Let's use standard console for now but also attempt to append to file using fs/promises (might miss crash logs)
        // actually let's just use require('fs') for sync
        require('fs').appendFileSync(logPath, logLine);
    } catch (e) {
        console.error('Failed to log to file:', e);
    }
    console.error(msg); // Keep console log too
}

logToFile('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
logToFile('!!! MAINJS STARTUP CHECKPOINT - IF YOU SEE THIS, CODE IS RUNNING !!!');
logToFile('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

function createWindow() {
    console.log('[Main] Creating window...');
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

    win.on('ready-to-show', () => {
        console.log('[Main] Window ready to show');
        win.show();
    });

    win.on('closed', () => {
        console.log('[Main] Window closed');
    });

    // Load the index.html from dist
    // If dev, load localhost
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    if (devUrl) {
        win.loadURL(devUrl);
        win.webContents.openDevTools();
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(async () => {
    console.log('[Main] App Ready');
    Menu.setApplicationMenu(null); // Remove default menu (and its accelerators)
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    // IPC Handlers
    ipcMain.on('app:log', (_, message) => {
        logToFile(`[Renderer] ${message}`);
    });

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

    ipcMain.handle('devcontainer:up', async (_, projectPath, config, options) => {
        const id = await startDevContainer(projectPath, config, options);
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

    ipcMain.handle('fs:getAllFiles', async (_, dirPath) => {
        const getAllFiles = async (dir: string): Promise<string[]> => {
            let results: string[] = [];
            try {
                const list = await fs.readdir(dir, { withFileTypes: true });
                for (const file of list) {
                    const filePath = path.join(dir, file.name);
                    if (file.isDirectory()) {
                        if (file.name !== '.git' && file.name !== 'node_modules' && file.name !== 'dist' && file.name !== '.build') {
                            const subFiles = await getAllFiles(filePath);
                            results = results.concat(subFiles);
                        }
                    } else {
                        results.push(filePath);
                    }
                }
            } catch (e) {
                console.error(`Error reading ${dir}`, e);
            }
            return results;
        };
        return getAllFiles(dirPath);
    });

    ipcMain.handle('fs:readFile', async (_, filePath) => {
        return fs.readFile(filePath, 'utf-8');
    });

    ipcMain.handle('fs:createFile', async (_, filePath, content = '') => {
        try {
            await fs.writeFile(filePath, content);
            return true;
        } catch (error) {
            console.error('Error creating file:', error);
            throw error;
        }
    });

    ipcMain.handle('fs:createDirectory', async (_, dirPath) => {
        try {
            await fs.mkdir(dirPath, { recursive: true });
            return true;
        } catch (error) {
            console.error('Error creating directory:', error);
            throw error;
        }
    });

    // File Watching
    const watchers = new Map<string, FSWatcher>();

    ipcMain.handle('fs:watch', (event, targetPath) => {
        logToFile(`[CHECKPOINT 1] Request to watch path: '${targetPath}'`);

        // Always close existing watcher to ensure we have the fresh sender
        const existingWatcher = watchers.get(targetPath);
        if (existingWatcher) {
            logToFile(`[CHECKPOINT 1.1] Closing existing watcher for: '${targetPath}'`);
            existingWatcher.close();
            watchers.delete(targetPath);
        }

        logToFile(`[CHECKPOINT 1.2] Creating new chokidar watcher for: '${targetPath}'`);
        const watcher = chokidar.watch(targetPath, {
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 100,
                pollInterval: 100
            }
        });

        watcher.on('all', (eventName, path) => {
            logToFile(`[CHECKPOINT 2] Chokidar event '${eventName}' on: '${path}'`);
            try {
                // Broadcast to all windows to ensure we hit the active renderer(s)
                BrowserWindow.getAllWindows().forEach(win => {
                    if (!win.isDestroyed()) {
                        win.webContents.send('fs:changed', { event: eventName, path });
                    }
                });
            } catch (err) {
                logToFile(`[CHECKPOINT 3-ERROR] Failed to send fs:changed: ${err}`);
            }
        });

        watcher.on('error', (error) => {
            logToFile(`[CHECKPOINT 2-ERROR] Chokidar error: ${error}`);
        });

        watchers.set(targetPath, watcher);
        logToFile(`[CHECKPOINT 1.3] Watcher set up successfully for: '${targetPath}'`);
    });

    ipcMain.handle('fs:unwatch', (_, targetPath) => {
        const watcher = watchers.get(targetPath);
        if (watcher) {
            watcher.close();
            watchers.delete(targetPath);
        }
    });

    // Settings Handlers
    const settingsManager = new SettingsManager();
    await settingsManager.load();

    settingsManager.on('change', (newSettings) => {
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('settings:updated', newSettings);
        });
    });

    ipcMain.handle('settings:get', (_, key) => settingsManager.get(key));
    ipcMain.handle('settings:set', (_, key, value) => settingsManager.set(key, value));
    ipcMain.handle('settings:getAll', () => settingsManager.getAll());
    ipcMain.handle('settings:getPath', () => settingsManager.getPath());
    ipcMain.handle('settings:reset', async () => {
        await settingsManager.reset();
        app.quit();
        // relaunch?
        // app.relaunch();
        // app.exit();
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

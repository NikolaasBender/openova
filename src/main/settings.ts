import fsPromises from 'fs/promises';
import fs from 'fs';
import { EventEmitter } from 'events';
import path from 'path';
import os from 'os';

export class SettingsManager extends EventEmitter {
    private settings: Record<string, any> = {};
    private settingsPath: string;

    constructor() {
        super();
        // ~/.config/OpenOva/User/settings.json
        this.settingsPath = path.join(os.homedir(), '.config', 'OpenOva', 'User', 'settings.json');
    }

    async load() {
        try {
            const data = await fsPromises.readFile(this.settingsPath, 'utf-8');
            this.settings = JSON.parse(data);
            console.log(`[Settings] Loaded from ${this.settingsPath}`);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                console.log(`[Settings] No settings file found at ${this.settingsPath}, using defaults.`);
                this.settings = {};
                await this.save(); // Create the file/dir
            } else {
                console.error('[Settings] Failed to load settings:', error);
            }
        }
        this.watch();
    }

    private debounceTimer: NodeJS.Timeout | null = null;

    private watch() {
        try {
            fs.watch(this.settingsPath, (eventType) => {
                if (eventType === 'change') {
                    if (this.debounceTimer) clearTimeout(this.debounceTimer);
                    this.debounceTimer = setTimeout(async () => {
                        console.log('[Settings] File changed, reloading...');
                        try {
                            const data = await fsPromises.readFile(this.settingsPath, 'utf-8');
                            this.settings = JSON.parse(data);
                            this.emit('change', this.settings);
                        } catch (e) {
                            console.error('[Settings] Failed to reload settings', e);
                        }
                    }, 100);
                }
            });
            console.log(`[Settings] Watching ${this.settingsPath}`);
        } catch (error) {
            console.error('[Settings] Failed to watch settings file:', error);
        }
    }

    async save() {
        try {
            await fsPromises.mkdir(path.dirname(this.settingsPath), { recursive: true });
            await fsPromises.writeFile(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf-8');
            console.log(`[Settings] Saved to ${this.settingsPath}`);
        } catch (error) {
            console.error('[Settings] Failed to save settings:', error);
        }
    }

    get(key: string): any {
        return this.settings[key];
    }

    set(key: string, value: any) {
        this.settings[key] = value;
        this.save(); // Auto-save on set
    }

    getAll(): Record<string, any> {
        return { ...this.settings };
    }

    async reset() {
        try {
            this.settings = {};
            await fsPromises.rm(this.settingsPath, { force: true });
            console.log('[Settings] Reset complete.');
        } catch (error) {
            console.error('[Settings] Failed to reset settings:', error);
        }
    }

    getPath(): string {
        return this.settingsPath;
    }
}

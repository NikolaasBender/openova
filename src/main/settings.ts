import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class SettingsManager {
    private settings: Record<string, any> = {};
    private settingsPath: string;

    constructor() {
        // ~/.config/OpenOva/User/settings.json
        this.settingsPath = path.join(os.homedir(), '.config', 'OpenOva', 'User', 'settings.json');
    }

    async load() {
        try {
            const data = await fs.readFile(this.settingsPath, 'utf-8');
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
    }

    async save() {
        try {
            await fs.mkdir(path.dirname(this.settingsPath), { recursive: true });
            await fs.writeFile(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf-8');
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
            await fs.rm(this.settingsPath, { force: true });
            console.log('[Settings] Reset complete.');
        } catch (error) {
            console.error('[Settings] Failed to reset settings:', error);
        }
    }

    getPath(): string {
        return this.settingsPath;
    }
}

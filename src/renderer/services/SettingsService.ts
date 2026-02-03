export class SettingsService {
    private static instance: SettingsService;
    private settings: Record<string, any> = {};

    private constructor() {
        console.log('SettingsService initialized');
        this.loadSettings();
    }

    public static getInstance(): SettingsService {
        if (!SettingsService.instance) {
            SettingsService.instance = new SettingsService();
        }
        return SettingsService.instance;
    }

    private async loadSettings() {
        try {
            this.settings = await (window as any).electronAPI?.invoke('settings:getAll') || {};
            console.log('[SettingsService] Loaded settings:', this.settings);
        } catch (e) {
            console.error('[SettingsService] Failed to load settings', e);
        }
    }

    public get(key: string): any {
        return this.settings[key];
    }

    public async set(key: string, value: any) {
        this.settings[key] = value;
        try {
            await (window as any).electronAPI?.invoke('settings:set', key, value);
        } catch (e) {
            console.error('[SettingsService] Failed to persist setting', key, e);
        }
    }

    public isDebugMode(): boolean {
        return !!this.get('debug.enabled');
    }

    public async resetSettings() {
        try {
            await (window as any).electronAPI?.invoke('settings:reset');
        } catch (e) {
            console.error('[SettingsService] Failed to reset settings', e);
        }
    }

    public async getSettingsPath(): Promise<string> {
        return await (window as any).electronAPI?.invoke('settings:getPath');
    }
}

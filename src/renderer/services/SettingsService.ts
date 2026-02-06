export class SettingsService {
    private static instance: SettingsService;
    private settings: Record<string, any> = {};
    private listeners: ((settings: any) => void)[] = [];

    private constructor() {
        console.log('SettingsService initialized');
        this.loadSettings();
        this.setupIpcListener();
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
            this.notifyListeners();
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

    private setupIpcListener() {
        (window as any).electronAPI?.onSettingsUpdate((newSettings: any) => {
            console.log('[SettingsService] Received update from main process', newSettings);
            this.settings = newSettings;
            this.notifyListeners();
        });
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.settings));
    }

    public onChange(callback: (settings: any) => void): () => void {
        this.listeners.push(callback);
        // Immediate callback with current settings
        if (Object.keys(this.settings).length > 0) {
            callback(this.settings);
        }
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }
}

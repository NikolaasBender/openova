/// <reference types="vite/client" />

interface Window {
    electronAPI: {
        selectFolder: () => Promise<string | null>;
        readDirectory: (path: string) => Promise<Array<{ name: string; isDirectory: boolean; path: string }>>;
        getAllFiles: (path: string) => Promise<string[]>;
        readFile: (path: string) => Promise<string>;
        createFile: (path: string, content?: string) => Promise<boolean>;
        createDirectory: (path: string) => Promise<boolean>;
        watch: (path: string) => Promise<void>;
        unwatch: (path: string) => Promise<void>;
        onFileChange: (callback: (data: { event: string; path: string }) => void) => () => void;
        minimize: () => void;
        maximize: () => void;
        close: () => void;
        terminal: {
            create: (cwd?: string) => Promise<number>;
            onIncoming: (callback: (data: { pid: number; data: string }) => void) => () => void;
            write: (pid: number, data: string) => void;
            resize: (pid: number, cols: number, rows: number) => void;
            dispose: (pid: number) => void;
        };
        checkDevContainer: (projectPath: string) => Promise<any>;
        startDevContainer: (projectPath: string, config: any, options?: any) => Promise<string>;
        searchExtensions: (query: string) => Promise<any[]>;
        log: (message: string) => void;
        invoke: (channel: string, ...args: any[]) => Promise<any>;
        onSettingsUpdate: (callback: (settings: any) => void) => () => void;
        platform: string;
    };
}

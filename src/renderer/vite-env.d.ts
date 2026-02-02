/// <reference types="vite/client" />

interface Window {
    electronAPI: {
        selectFolder: () => Promise<string | null>;
        readDirectory: (path: string) => Promise<Array<{ name: string; isDirectory: boolean; path: string }>>;
        readFile: (path: string) => Promise<string>;
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
        startDevContainer: (projectPath: string, config: any) => Promise<string>;
        searchExtensions: (query: string) => Promise<any[]>;
    };
}

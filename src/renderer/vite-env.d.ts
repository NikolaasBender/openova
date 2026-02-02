/// <reference types="vite/client" />

interface Window {
    electronAPI: {
        selectFolder: () => Promise<string | null>;
        readDirectory: (path: string) => Promise<Array<{ name: string; isDirectory: boolean; path: string }>>;
        readFile: (path: string) => Promise<string>;
        minimize: () => void;
        maximize: () => void;
        close: () => void;
    };
}

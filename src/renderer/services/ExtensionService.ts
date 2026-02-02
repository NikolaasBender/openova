
export interface Extension {
    namespace: string;
    name: string;
    version: string;
    displayName?: string;
    description?: string;
    publisher?: string; // Often 'namespace' is used, but sometimes distinct in UI
    files: {
        icon?: string;
        download?: string;
    };
}

export interface SearchResult {
    extensions: Extension[];
    totalSize: number;
}

const REGISTRY_URL = 'https://open-vsx.org/api';

export const ExtensionService = {
    async searchExtensions(query: string): Promise<Extension[]> {
        if (!query) return [];

        try {
            return await window.electronAPI.searchExtensions(query);
        } catch (error) {
            console.error('Extension search error:', error);
            return [];
        }
    },

    async getExtensionDetails(namespace: string, name: string): Promise<Extension | null> {
        try {
            const response = await fetch(`${REGISTRY_URL}/${namespace}/${name}`);
            if (!response.ok) {
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error('Get extension details error:', error);
            return null;
        }
    }
};

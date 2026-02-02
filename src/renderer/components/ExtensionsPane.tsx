import React, { useState, useCallback } from 'react';
import { Extension, ExtensionService } from '../services/ExtensionService';

interface ExtensionsPaneProps {
    width: number;
}

const ExtensionsPane: React.FC<ExtensionsPaneProps> = ({ width }) => {
    const [query, setQuery] = useState('');
    const [extensions, setExtensions] = useState<Extension[]>([]);
    const [loading, setLoading] = useState(false);
    const [installedExtensions, setInstalledExtensions] = useState<Set<string>>(new Set());
    const [installing, setInstalling] = useState<Set<string>>(new Set());

    const handleSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const results = await ExtensionService.searchExtensions(query);
            setExtensions(results);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [query]);

    const handleInstall = (ext: Extension) => {
        const id = ext.namespace + '.' + ext.name;
        setInstalling(prev => new Set(prev).add(id));

        // Simulate download/install delay
        setTimeout(() => {
            setInstalledExtensions(prev => new Set(prev).add(id));
            setInstalling(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }, 1500);
    };

    return (
        <div style={{ width }} className="bg-vscode-sidebar border-r border-[#2b2b2b] flex flex-col h-full text-[#cccccc] shrink-0">
            <div className="p-2 text-xs font-bold uppercase tracking-wider flex justify-between items-center">
                <span>Extensions</span>
            </div>

            <div className="p-2">
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search Extensions in Marketplace"
                        className="w-full bg-[#3c3c3c] border border-[#3c3c3c] text-white px-2 py-1 text-sm rounded outline-none focus:border-[#007fd4]"
                    />
                </form>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading && <div className="p-4 text-center text-xs">Loading...</div>}

                {!loading && extensions.length === 0 && query && (
                    <div className="p-4 text-center text-xs">No extensions found.</div>
                )}

                {extensions.map(ext => {
                    const id = ext.namespace + '.' + ext.name;
                    const isInstalled = installedExtensions.has(id);

                    return (
                        <div key={id} className="p-2 border-b border-[#2b2b2b] hover:bg-[#2a2d2e] flex flex-col gap-1">
                            <div className="flex items-start gap-2">
                                <img
                                    src={ext.files.icon || 'https://raw.githubusercontent.com/microsoft/vscode-icons/master/icons/dark/file-type-vscode.svg'}
                                    alt="icon"
                                    className="w-10 h-10 object-contain bg-[#333]"
                                    onError={(e) => { e.currentTarget.src = 'https://raw.githubusercontent.com/microsoft/vscode-icons/master/icons/dark/file-type-vscode.svg' }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm truncate" title={ext.displayName || ext.name}>{ext.displayName || ext.name}</div>
                                    <div className="text-xs text-gray-400 truncate" title={ext.description}>{ext.description}</div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[10px] text-gray-500">{ext.publisher}</span>
                                        <button
                                            onClick={() => handleInstall(ext)}
                                            disabled={isInstalled}
                                            className={`text-[10px] px-2 py-0.5 rounded ${isInstalled ? 'bg-[#333] text-gray-400 cursor-default' : 'bg-[#0e639c] text-white hover:bg-[#1177bb]'} transition-colors`}
                                        >
                                            {isInstalled ? 'Installed' : installing.has(id) ? 'Installing...' : 'Install'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ExtensionsPane;

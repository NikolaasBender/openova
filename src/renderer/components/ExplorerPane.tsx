import React, { useState, useEffect, createContext, useContext, useRef } from 'react';

interface FileNode {
    name: string;
    isDirectory: boolean;
    path: string;
    children?: FileNode[];
    isOpen?: boolean;
}

interface SidebarProps {
    onFileSelect: (path: string) => void;
    width?: number;
    rootPath: string | null;
    onRootPathChange: (path: string) => void;
}

// Context to broadcast file change events to all tree nodes
interface FileChangeContextType {
    lastChangeEvent: { event: string; path: string } | null;
}
const FileChangeContext = createContext<FileChangeContextType>({ lastChangeEvent: null });

// Helper to get directory name from a path (simple string manipulation for renderer)
const getDirname = (path: string) => {
    const separator = path.includes('\\') ? '\\' : '/';
    return path.substring(0, path.lastIndexOf(separator));
};

const ExplorerPane: React.FC<SidebarProps> = ({ onFileSelect, width = 250, rootPath, onRootPathChange }) => {
    window.electronAPI.log(`[ExplorerPane] Render. RootPath: ${rootPath}`);
    const [files, setFiles] = useState<FileNode[]>([]);
    const [lastChangeEvent, setLastChangeEvent] = useState<{ event: string; path: string } | null>(null);

    // Startup check
    useEffect(() => {
        window.electronAPI.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        window.electronAPI.log('!!! EXPLORER PANE MOUNTED - CHECKPOINT !!!');
        window.electronAPI.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    }, []);

    // Initial load of root files
    const refreshRootFiles = async () => {
        if (rootPath) {
            const rootFiles = await window.electronAPI.readDirectory(rootPath);
            setFiles(rootFiles.sort((a, b) => (Number(b.isDirectory) - Number(a.isDirectory))));
        }
    };

    const handleOpenFolder = async () => {
        const path = await window.electronAPI.selectFolder();
        if (path) {
            onRootPathChange(path);
        }
    };

    useEffect(() => {
        const loadFiles = async () => {
            if (rootPath) {
                await refreshRootFiles();
                // Start watching recursively (now supported by main process)
                window.electronAPI.log(`[ExplorerPane] Requesting watch for: ${rootPath}`);
                await window.electronAPI.watch(rootPath);

                // Listen for changes
                const removeListener = window.electronAPI.onFileChange((data) => {
                    window.electronAPI.log(`[CHECKPOINT 6] ExplorerPane received event: ${data.event} ${data.path}`);

                    // Update the context so deep nodes can react
                    setLastChangeEvent(data);

                    // Also check if we need to update root files directly
                    if (data.path.startsWith(rootPath)) {
                        const dir = getDirname(data.path);
                        const isRoot = dir === rootPath || (window.electronAPI.platform === 'win32' && dir.toLowerCase() === rootPath.toLowerCase());

                        window.electronAPI.log(`[CHECKPOINT 7] Checking if root update needed. Dir: '${dir}', Root: '${rootPath}', IsRoot: ${isRoot}`);

                        if (isRoot) {
                            window.electronAPI.log(`[CHECKPOINT 7.1] Triggering root refresh`);
                            refreshRootFiles();
                        }
                    } else {
                        window.electronAPI.log(`[CHECKPOINT 7-FAIL] Path '${data.path}' does not start with rootPath '${rootPath}'`);
                    }
                });

                return () => {
                    window.electronAPI.unwatch(rootPath);
                    removeListener();
                };
            } else {
                setFiles([]);
            }
        }
        loadFiles();
    }, [rootPath]);

    const handleCreateFile = async () => {
        if (!rootPath) return;
        const name = prompt("Enter file name:");
        if (name) {
            const separator = rootPath.includes('\\') ? '\\' : '/';
            const fullPath = `${rootPath}${separator}${name}`;
            await window.electronAPI.createFile(fullPath);
        }
    };

    const handleCreateDirectory = async () => {
        if (!rootPath) return;
        const name = prompt("Enter folder name:");
        if (name) {
            const separator = rootPath.includes('\\') ? '\\' : '/';
            const fullPath = `${rootPath}${separator}${name}`;
            await window.electronAPI.createDirectory(fullPath);
        }
    };

    return (
        <FileChangeContext.Provider value={{ lastChangeEvent }}>
            <div style={{ width }} className="bg-vscode-sidebar border-r border-[#2b2b2b] flex flex-col h-full text-[#cccccc] shrink-0">
                <div className="p-2 text-xs font-bold uppercase tracking-wider flex justify-between items-center group">
                    <span>Explorer</span>
                    {rootPath && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={handleCreateFile} className="hover:bg-[#3c3c3c] p-1 rounded" title="New File">
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M9 1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6l-5-5zm0 1.5L12.5 6H9V2.5zM4 2h4v5h5v7H4V2z" /></svg>
                            </button>
                            <button onClick={handleCreateDirectory} className="hover:bg-[#3c3c3c] p-1 rounded" title="New Folder">
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M7.71 3H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H9.41L7.71 3z" /></svg>
                            </button>
                            <button onClick={refreshRootFiles} className="hover:bg-[#3c3c3c] p-1 rounded" title="Refresh">
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 8a5.5 5.5 0 1 1-1.255-3.488l-1.09.217a4.5 4.5 0 1 0 .842 2.772h1.503z" /><path d="M10.742 2.058l1.396 3.654A.5.5 0 0 0 12.607 6h3.896a.5.5 0 0 0 .341-.866l-2.61-2.48l1.206-3.86a.5.5 0 0 0-.82-.572L12.138 1.48l-2.073-1.63a.5.5 0 0 0-.323 2.208z" transform="translate(0, 1)" /></svg>
                            </button>
                        </div>
                    )}
                </div>

                {!rootPath && (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                        <p className="text-sm mb-4">No folder opened.</p>
                        <button
                            onClick={handleOpenFolder}
                            className="bg-[#0e639c] text-white px-4 py-1.5 text-xs rounded hover:bg-[#1177bb]"
                        >
                            Open Folder
                        </button>
                    </div>
                )}

                {rootPath && (
                    <div className="flex-1 overflow-y-auto mt-1">
                        <div className="px-3 py-1 text-xs font-bold text-white mb-2 truncate" title={rootPath}>{rootPath.split('/').pop()}</div>
                        <FileTree nodes={files} onFileSelect={onFileSelect} />
                    </div>
                )}
            </div>
        </FileChangeContext.Provider>
    );
};

const FileTree: React.FC<{ nodes: FileNode[]; onFileSelect: (p: string) => void }> = ({ nodes, onFileSelect }) => {
    return (
        <div className="flex flex-col">
            {nodes.map((node) => (
                <FileTreeNode key={node.path} node={node} onFileSelect={onFileSelect} />
            ))}
        </div>
    );
}

const FileTreeNode: React.FC<{ node: FileNode; onFileSelect: (p: string) => void }> = ({ node, onFileSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [children, setChildren] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(false);

    // Sub directory caching
    const [hasLoadedChildren, setHasLoadedChildren] = useState(false);

    const { lastChangeEvent } = useContext(FileChangeContext);
    const lastEventRef = useRef(lastChangeEvent);

    const fetchChildren = async () => {
        setLoading(true);
        try {
            const items = await window.electronAPI.readDirectory(node.path);
            setChildren(items.sort((a, b) => (Number(b.isDirectory) - Number(a.isDirectory))));
            setHasLoadedChildren(true);
        } catch (e) {
            console.error("Failed to load children", e);
        }
        setLoading(false);
    };

    const handleClick = async () => {
        if (node.isDirectory) {
            if (!isOpen && !hasLoadedChildren) {
                await fetchChildren();
            }
            setIsOpen(!isOpen);
        } else {
            onFileSelect(node.path);
        }
    };

    // React to file changes
    useEffect(() => {
        if (!lastChangeEvent) return;
        if (lastChangeEvent === lastEventRef.current) return;
        lastEventRef.current = lastChangeEvent;

        if (node.isDirectory) {
            const changedPath = lastChangeEvent.path;
            const changedDir = getDirname(changedPath);

            // Check if the change happened DIRECTLY inside this directory
            const isMatch = changedDir === node.path || (window.electronAPI.platform === 'win32' && changedDir.toLowerCase() === node.path.toLowerCase());

            if (isMatch) {
                window.electronAPI.log(`[CHECKPOINT 8] FileTreeNode hit! Node: '${node.path}' matches change in '${changedDir}'`);
                if (hasLoadedChildren) {
                    window.electronAPI.log(`[CHECKPOINT 9] Refreshing children for '${node.path}'`);
                    fetchChildren();
                } else {
                    window.electronAPI.log(`[CHECKPOINT 8.1] Node '${node.path}' matches but children not loaded yet. Skipping.`);
                }
            }
        }
    }, [lastChangeEvent, node.path, node.isDirectory, hasLoadedChildren]);

    return (
        <div className="select-none cursor-pointer">
            <div
                className={`flex items-center py-1 px-4 hover:bg-[#2a2d2e] text-sm ${!node.isDirectory ? 'ml-2' : ''}`}
                onClick={handleClick}
            >
                {node.isDirectory && (
                    <span className={`mr-1 transform transition-transform ${isOpen ? 'rotate-90' : ''} text-gray-400 text-[10px]`}>▶</span>
                )}
                {!node.isDirectory && <span className="w-4"></span>}
                <span className={`${node.isDirectory ? 'font-semibold text-gray-300' : 'text-gray-400'}`}>
                    {node.name}
                </span>
            </div>
            {isOpen && (
                <div className="pl-4 border-l border-[#333] ml-2">
                    {loading ? <div className="text-xs text-gray-500 pl-4">Loading...</div> : <FileTree nodes={children} onFileSelect={onFileSelect} />}
                </div>
            )}
        </div>
    );
};

export default ExplorerPane;

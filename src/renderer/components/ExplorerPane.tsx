import React, { useState } from 'react';

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

const ExplorerPane: React.FC<SidebarProps> = ({ onFileSelect, width = 250, rootPath, onRootPathChange }) => {
    // const [rootPath, setRootPath] = useState<string | null>(null); // Lifted
    const [files, setFiles] = useState<FileNode[]>([]);

    const handleOpenFolder = async () => {
        const path = await window.electronAPI.selectFolder();
        if (path) {
            onRootPathChange(path);
            const rootFiles = await window.electronAPI.readDirectory(path);
            setFiles(rootFiles.sort((a, b) => (Number(b.isDirectory) - Number(a.isDirectory)))); // Dirs first
        }
    };

    // Effect to reload files if rootPath changes (e.g. from potential other sources, though mainly handleOpenFolder now)
    // Actually handleOpenFolder does both set and load. Let's keep it simple.
    // Ideally we should use useEffect to load files when rootPath changes.
    React.useEffect(() => {
        const loadFiles = async () => {
            if (rootPath) {
                const rootFiles = await window.electronAPI.readDirectory(rootPath);
                setFiles(rootFiles.sort((a, b) => (Number(b.isDirectory) - Number(a.isDirectory))));
            } else {
                setFiles([]);
            }
        }
        loadFiles();
    }, [rootPath]);

    const toggleDirectory = async (node: FileNode, index: number) => {
        // Very simple flat list expansion for MVP or need recursive?
        // For MVP, if we want to expand, we need to load children.
        // Let's implement full recursion later or use a recursive component.
        // Implementing a recursive component inline.
    };

    return (
        <div style={{ width }} className="bg-vscode-sidebar border-r border-[#2b2b2b] flex flex-col h-full text-[#cccccc] shrink-0">
            <div className="p-2 text-xs font-bold uppercase tracking-wider flex justify-between items-center">
                <span>Explorer</span>
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
                    <div className="px-3 py-1 text-xs font-bold text-white mb-2">{rootPath.split('/').pop()}</div>
                    <FileTree nodes={files} onFileSelect={onFileSelect} />
                </div>
            )}
        </div>
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

    const handleClick = async () => {
        if (node.isDirectory) {
            if (!isOpen && children.length === 0) {
                setLoading(true);
                const items = await window.electronAPI.readDirectory(node.path);
                setChildren(items.sort((a, b) => (Number(b.isDirectory) - Number(a.isDirectory))));
                setLoading(false);
            }
            setIsOpen(!isOpen);
        } else {
            onFileSelect(node.path);
        }
    };

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

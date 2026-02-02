import { useState, useRef, useCallback, useEffect } from 'react'
import Editor from './components/Editor'
import ExplorerPane from './components/ExplorerPane' // Renamed from Sidebar
import ExtensionsPane from './components/ExtensionsPane'
import ActivityBar from './components/ActivityBar'
import WindowControls from './components/WindowControls'
import TerminalPane from './components/TerminalPane'
import TabBar from './components/TabBar'

function App() {
    const [tabs, setTabs] = useState<Array<{ path: string; name: string; content: string; isDirty: boolean }>>([]);
    const [activeTabPath, setActiveTabPath] = useState<string | null>(null);
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [isTerminalOpen, setIsTerminalOpen] = useState(true);
    const [rootPath, setRootPath] = useState<string | null>(null);
    const [devContainerConfig, setDevContainerConfig] = useState<any | null>(null);

    useEffect(() => {
        if (rootPath) {
            window.electronAPI.checkDevContainer(rootPath)
                .then(config => {
                    setDevContainerConfig(config);
                })
                .catch(err => console.error('Error checking dev container:', err));
        } else {
            setDevContainerConfig(null);
        }
    }, [rootPath]);

    // New state for Activity Bar
    const [activeView, setActiveView] = useState<'explorer' | 'extensions'>('explorer');

    const isResizing = useRef(false);

    const startResizing = useCallback(() => {
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
    }, []);

    const stopResizing = useCallback(() => {
        isResizing.current = false;
        document.body.style.cursor = 'default';
    }, []);

    const resize = useCallback((mouseEvent: MouseEvent) => {
        if (isResizing.current) {
            setSidebarWidth(mouseEvent.clientX);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        setSidebarWidth(prev => prev === 0 ? 250 : 0);
                        break;
                    case '`':
                        e.preventDefault();
                        setIsTerminalOpen(prev => !prev);
                        break;
                    case 'e':
                        if (e.shiftKey) {
                            e.preventDefault();
                            setActiveView('explorer');
                            setSidebarWidth(250); // Ensure visible
                        }
                        break;
                    case 'x':
                        if (e.shiftKey) {
                            e.preventDefault();
                            setActiveView('extensions');
                            setSidebarWidth(250); // Ensure visible
                        }
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleFileSelect = async (path: string) => {
        // Check if tab already exists
        const existingTab = tabs.find(t => t.path === path);
        if (existingTab) {
            setActiveTabPath(path);
            return;
        }

        try {
            const content = await window.electronAPI.readFile(path);
            const name = path.split(/[/\\]/).pop() || path;

            setTabs(prev => [...prev, {
                path,
                name,
                content,
                isDirty: false
            }]);
            setActiveTabPath(path);
        } catch (e) {
            console.error("Error reading file:", e);
        }
    };

    const handleTabClose = (path: string, e: React.MouseEvent) => {
        e.stopPropagation();

        setTabs(prev => {
            const newTabs = prev.filter(t => t.path !== path);

            // If we closed the active tab, switch to another one
            if (path === activeTabPath) {
                if (newTabs.length > 0) {
                    // Try to go to the tab to the right, or the last one if we closed the last one
                    const visibleTabs = prev; // In a real app we might filter hidden tabs
                    const closedIndex = visibleTabs.findIndex(t => t.path === path);
                    const nextTab = newTabs[closedIndex] || newTabs[newTabs.length - 1];
                    setActiveTabPath(nextTab.path);
                } else {
                    setActiveTabPath(null);
                }
            }

            return newTabs;
        });
    };

    const handleEditorChange = (value: string | undefined) => {
        if (activeTabPath && value !== undefined) {
            setTabs(prev => prev.map(tab =>
                tab.path === activeTabPath
                    ? { ...tab, content: value, isDirty: true }
                    : tab
            ));
        }
    };

    const activeTab = tabs.find(t => t.path === activeTabPath);

    return (
        <div className="flex flex-col h-screen w-screen bg-vscode-bg text-white overflow-hidden">
            {/* Title Bar */}
            <div className="h-8 bg-[#3c3c3c] flex items-center justify-between titlebar-drag-region w-full border-b border-[#2b2b2b] select-none shrink-0 pr-0">
                <div className="flex items-center pl-3">
                    <span className="text-xs text-[#cccccc]">OpenOva - VS Code Clone</span>
                </div>
                <WindowControls />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Activity Bar */}
                <ActivityBar activeView={activeView} onViewChange={setActiveView} />

                {/* Sidebar Pane (Dynamic based on ActivityBar) */}
                {activeView === 'explorer' && (
                    <ExplorerPane
                        width={sidebarWidth}
                        onFileSelect={handleFileSelect}
                        rootPath={rootPath}
                        onRootPathChange={setRootPath}
                    />
                )}
                {activeView === 'extensions' && (
                    <ExtensionsPane width={sidebarWidth} />
                )}

                {/* Resize Handle */}
                <div
                    className="w-1 cursor-col-resize hover:bg-[#007fd4] transition-colors active:bg-[#007fd4] z-30"
                    onMouseDown={startResizing}
                />

                {/* Main Editor Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
                    {/* Tab Bar */}
                    <div className="shrink-0">
                        {/* We import TabBar manually at the top, ensuring to add the import */}
                        <TabBar
                            tabs={tabs}
                            activeTabPath={activeTabPath}
                            onTabClick={setActiveTabPath}
                            onTabClose={handleTabClose}
                        />
                    </div>

                    <div className="flex-1 relative">
                        <Editor
                            content={activeTab?.content || "// Select a file to view"}
                            language={activeTab?.name.split('.').pop() || 'javascript'}
                            onChange={handleEditorChange}
                        />
                    </div>
                    {isTerminalOpen && (
                        <div className="h-64 border-t border-[#2b2b2b]">
                            <TerminalPane cwd={rootPath || undefined} />
                        </div>
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="h-6 bg-vscode-statusbar w-full text-xs flex items-center px-0 z-30 select-none cursor-default shrink-0">
                {devContainerConfig && (
                    <div
                        className="bg-[#16825d] text-white px-3 h-full flex items-center mr-0 cursor-pointer hover:bg-[#136c4e] transition-colors gap-2"
                        onClick={async () => {
                            if (rootPath && devContainerConfig) {
                                try {
                                    const id = await window.electronAPI.startDevContainer(rootPath, devContainerConfig);
                                    alert(`Dev Container Started: ${id.substring(0, 12)}`);
                                } catch (error) {
                                    console.error(error);
                                    alert('Failed to start container');
                                }
                            }
                        }}
                    >
                        <span>{'>'}{'<'}</span>
                        <span className="font-medium">Dev Container</span>
                    </div>
                )}
                <div className="px-2 flex items-center">
                    <span className="mr-4">main*</span>
                    <span className="mr-4">Ln 1, Col 1</span>
                    <span className="mr-4">UTF-8</span>
                    <span className="mr-4">{activeTab?.name.split('.').pop()?.toUpperCase() || 'TXT'}</span>
                    <span
                        className="mr-4 hover:text-white cursor-pointer"
                        onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                    >
                        Terminal
                    </span>
                </div>
            </div>
        </div>
    )
}

export default App

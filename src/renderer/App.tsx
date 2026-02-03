import { useState, useRef, useCallback, useEffect } from 'react'
import Editor from './components/Editor'
import ExplorerPane from './components/ExplorerPane' // Renamed from Sidebar
import ExtensionsPane from './components/ExtensionsPane'
import ActivityBar from './components/ActivityBar'
import WindowControls from './components/WindowControls'
import TerminalPane from './components/TerminalPane'
import TabBar from './components/TabBar'
import { KeybindingService } from './services/KeybindingService'
import { DebugOverlay } from './components/DebugOverlay'
import { SettingsService } from './services/SettingsService'
import { MenuBar } from './components/MenuBar'
import { NotificationToast } from './components/NotificationToast'

import Palette, { PaletteItem } from './components/Palette';

function App() {
    const [tabs, setTabs] = useState<Array<{ path: string; name: string; content: string; isDirty: boolean }>>([]);
    const [activeTabPath, setActiveTabPath] = useState<string | null>(null);
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [isTerminalOpen, setIsTerminalOpen] = useState(true);
    const [rootPath, setRootPath] = useState<string | null>(null);
    const [isElectron, setIsElectron] = useState(false);
    const [isDebug, setIsDebug] = useState(false);

    // Palette State
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [paletteMode, setPaletteMode] = useState<'commands' | 'files'>('commands');
    const [paletteItems, setPaletteItems] = useState<PaletteItem[]>([]);
    const [allFiles, setAllFiles] = useState<string[]>([]);

    useEffect(() => {
        const isElec = !!(window.electronAPI && window.electronAPI.log);
        setIsElectron(isElec);
        if (isElec) {
            window.electronAPI.log('App mounted successfully');
        } else {
            console.error('electronAPI not available - Running in Browser?');
        }

        // Init debug state
        setTimeout(() => {
            setIsDebug(SettingsService.getInstance().isDebugMode());
        }, 500); // Wait for settings to load
    }, []);

    // ... (existing devContainer code)
    const [devContainerConfig, setDevContainerConfig] = useState<any | null>(null);

    useEffect(() => {
        // ... existing dev container logic
        if (rootPath) {
            window.electronAPI.checkDevContainer(rootPath)
                .then(config => setDevContainerConfig(config))
                .catch(err => console.error('Error checking dev container:', err));

            // Pre-fetch files for Quick Open
            window.electronAPI.getAllFiles(rootPath)
                .then(files => setAllFiles(files))
                .catch(err => console.error('Error fetching files:', err));
        } else {
            setDevContainerConfig(null);
            setAllFiles([]);
        }
    }, [rootPath]);

    // ... (existing Activity Bar state)
    const [activeView, setActiveView] = useState<'explorer' | 'extensions'>('explorer');
    const isResizing = useRef(false);
    const startResizing = useCallback(() => { isResizing.current = true; document.body.style.cursor = 'col-resize'; }, []);
    const stopResizing = useCallback(() => { isResizing.current = false; document.body.style.cursor = 'default'; }, []);
    const resize = useCallback((mouseEvent: MouseEvent) => { if (isResizing.current) setSidebarWidth(mouseEvent.clientX); }, []);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    // Command List
    const getCommands = (): PaletteItem[] => [
        { id: 'toggle.sidebar', label: 'View: Toggle Sidebar', handler: () => setSidebarWidth(prev => prev === 0 ? 250 : 0) },
        { id: 'toggle.terminal', label: 'View: Toggle Terminal', handler: () => setIsTerminalOpen(prev => !prev) },
        { id: 'view.explorer', label: 'View: Show Explorer', handler: () => { setActiveView('explorer'); setSidebarWidth(250); } },
        { id: 'view.extensions', label: 'View: Show Extensions', handler: () => { setActiveView('extensions'); setSidebarWidth(250); } },
        { id: 'file.save', label: 'File: Save', handler: () => alert('Save not implemented yet') }, // Placeholder
        { id: 'developer.reload', label: 'Developer: Reload Window', handler: () => window.location.reload() },
    ];

    const openPalette = (mode: 'commands' | 'files') => {
        setPaletteMode(mode);
        if (mode === 'commands') {
            setPaletteItems(getCommands());
        } else {
            // Map file paths to PaletteItems
            const items = allFiles.map(path => ({
                id: path,
                label: path.split(/[/\\]/).pop() || path,
                detail: path.replace(rootPath || '', '')
            }));
            setPaletteItems(items);
        }
        setIsPaletteOpen(true);
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const keybindingService = KeybindingService.getInstance();

        keybindingService.register('toggle.sidebar', 'Ctrl+b', () => setSidebarWidth(prev => prev === 0 ? 250 : 0));
        keybindingService.register('toggle.terminal', 'Ctrl+`', () => setIsTerminalOpen(prev => !prev));

        const togglePalette = () => openPalette('commands');
        keybindingService.register('workbench.action.showCommands', 'Ctrl+Shift+P', togglePalette);
        keybindingService.register('workbench.action.showCommands.f1', 'F1', togglePalette);

        keybindingService.register('workbench.action.quickOpen', 'Ctrl+p', () => {
            openPalette('files');
        });

        // Re-register view commands for consistency if needed, or just let them exist in list
        keybindingService.register('view.explorer', 'Ctrl+Shift+e', () => { setActiveView('explorer'); setSidebarWidth(250); });
        keybindingService.register('view.extensions', 'Ctrl+Shift+x', () => { setActiveView('extensions'); setSidebarWidth(250); });

        return () => {
            keybindingService.unregister('toggle.sidebar');
            keybindingService.unregister('toggle.terminal');
            keybindingService.unregister('workbench.action.showCommands');
            keybindingService.unregister('workbench.action.showCommands.f1');
            keybindingService.unregister('workbench.action.quickOpen');
            keybindingService.unregister('view.explorer');
            keybindingService.unregister('view.extensions');
        };
    }, [allFiles, rootPath]); // Re-bind if dependencies change to ensure openPalette has fresh scope if needed? 
    // Actually, `openPalette` depends on `allFiles`. So we need to ensure the closure is updated.
    // Ideally, keybinding service should handle this, or we just rely on `allFiles` being a ref or similar.
    // But since we re-register on change, it's fine.

    // ... (existing helper functions: handleFileSelect, handleTabClose, handleEditorChange)
    const handleFileSelect = async (path: string) => {
        // ... same logic
        const existingTab = tabs.find(t => t.path === path);
        if (existingTab) {
            setActiveTabPath(path);
            return;
        }
        try {
            const content = await window.electronAPI.readFile(path);
            const name = path.split(/[/\\]/).pop() || path;
            setTabs(prev => [...prev, { path, name, content, isDirty: false }]);
            setActiveTabPath(path);
        } catch (e) {
            console.error("Error reading file:", e);
        }
    };

    // ... handleTabClose, handleEditorChange ...
    const handleTabClose = (path: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setTabs(prev => {
            const newTabs = prev.filter(t => t.path !== path);
            if (path === activeTabPath) {
                if (newTabs.length > 0) {
                    const visibleTabs = prev;
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
            setTabs(prev => prev.map(tab => tab.path === activeTabPath ? { ...tab, content: value, isDirty: true } : tab));
        }
    };

    const activeTab = tabs.find(t => t.path === activeTabPath);

    const toggleDebug = async () => {
        const next = !isDebug;
        setIsDebug(next);
        await SettingsService.getInstance().set('debug.enabled', next);
    };

    const resetSettings = async () => {
        if (confirm('Are you sure you want to reset all settings and restart?')) {
            await SettingsService.getInstance().resetSettings();
        }
    };


    const handleOpenFolder = async () => {
        const path = await window.electronAPI.selectFolder();
        if (path) {
            setRootPath(path);
        }
    };

    const handleOpenSettings = async () => {
        try {
            const settingsPath = await SettingsService.getInstance().getSettingsPath();
            await handleFileSelect(settingsPath);
        } catch (e) {
            console.error('Failed to open settings:', e);
            alert('Failed to find settings file.');
        }
    };


    // ... logic for dev container notification
    const [showDevContainerToast, setShowDevContainerToast] = useState(false);
    const [isContainerRunning, setIsContainerRunning] = useState(false);

    useEffect(() => {
        if (devContainerConfig && rootPath) {
            // Show toast when config is found
            // In a real app we might check if it's already running to suppress this, or show "Reopen"
            setShowDevContainerToast(true);
        } else {
            setShowDevContainerToast(false);
        }
    }, [devContainerConfig, rootPath]);

    const handleStartContainer = async (rebuild: boolean = false) => {
        if (!rootPath || !devContainerConfig) return;
        try {
            setShowDevContainerToast(false); // Hide toast while starting
            // Maybe show a "Starting..." toast or status?
            const id = await window.electronAPI.startDevContainer(rootPath, devContainerConfig, { rebuild });
            alert(`Dev Container Started: ${id.substring(0, 12)}`);
            setIsContainerRunning(true);
        } catch (error) {
            console.error(error);
            alert('Failed to start container');
            setShowDevContainerToast(true); // Show again on failure?
        }
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-vscode-bg text-white overflow-hidden relative">
            <Palette
                isOpen={isPaletteOpen}
                mode={paletteMode}
                items={paletteItems}
                onClose={() => setIsPaletteOpen(false)}
                onSelect={(item) => {
                    setIsPaletteOpen(false);
                    if (item.handler) {
                        item.handler();
                    } else if (paletteMode === 'files') {
                        handleFileSelect(item.id);
                    }
                }}
            />

            <NotificationToast
                isVisible={showDevContainerToast}
                title="Dev Container Detected"
                message="This folder contains a Dev Container configuration. Do you want to reopen it in a container?"
                onClose={() => setShowDevContainerToast(false)}
                actions={[
                    {
                        label: 'Reopen in Container',
                        handler: () => handleStartContainer(false),
                        variant: 'primary'
                    },
                    {
                        label: 'Rebuild and Reopen',
                        handler: () => handleStartContainer(true),
                        variant: 'secondary'
                    },
                    {
                        label: 'Connect to Container',
                        handler: () => {
                            // Logic to just open terminal if known running, for now just start/attach
                            // In real VS Code this attaches to an existing container.
                            // Here startDevContainer is idempotent-ish if we handle checking if running...
                            // Actually startDevContainer tries to run a new one. 
                            // For MVP 'Connect' can just be 'Open Terminal' if we track running state, 
                            // or attempts to start (which will be a duplicate if we don't handle it).
                            // Let's assume for now it tries to start (Open). 
                            handleStartContainer(false);
                        },
                        variant: 'secondary'
                    }
                ]}
            />

            {/* Title Bar */}
            <div className="h-8 bg-[#3c3c3c] flex items-center justify-between titlebar-drag-region w-full border-b border-[#2b2b2b] select-none shrink-0 pr-0">
                <div className="flex items-center pl-3">
                    {/* Replaced Icon/Text with Menu Bar */}
                    <div className="mr-4 text-xs text-[#cccccc] font-bold hidden sm:block">OpenOva</div>
                    <div className="no-drag titlebar-no-drag h-full">
                        <MenuBar onOpenFolder={handleOpenFolder} onOpenSettings={handleOpenSettings} />
                    </div>
                </div>
                <WindowControls />
            </div>

            <DebugOverlay />

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Activity Bar */}
                <ActivityBar activeView={activeView} onViewChange={setActiveView} />

                {/* Sidebar Pane */}
                {activeView === 'explorer' && (
                    <ExplorerPane
                        width={sidebarWidth}
                        onFileSelect={handleFileSelect}
                        rootPath={rootPath}
                        onRootPathChange={setRootPath}
                    />
                )}
                {activeView === 'extensions' && (<ExtensionsPane width={sidebarWidth} />)}

                {/* Resize Handle */}
                <div className="w-1 cursor-col-resize hover:bg-[#007fd4] transition-colors active:bg-[#007fd4] z-30" onMouseDown={startResizing} />

                {/* Main Editor Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
                    {/* Tab Bar */}
                    <div className="shrink-0">
                        <TabBar tabs={tabs} activeTabPath={activeTabPath} onTabClick={setActiveTabPath} onTabClose={handleTabClose} />
                    </div>

                    <div className="flex-1 relative">
                        <Editor content={activeTab?.content || "// Select a file to view"} language={activeTab?.name.split('.').pop() || 'javascript'} onChange={handleEditorChange} />
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
                    <div className="bg-[#16825d] text-white px-3 h-full flex items-center mr-0 cursor-pointer hover:bg-[#136c4e] transition-colors gap-2" onClick={async () => {
                        if (rootPath && devContainerConfig) {
                            try {
                                const id = await window.electronAPI.startDevContainer(rootPath, devContainerConfig);
                                alert(`Dev Container Started: ${id.substring(0, 12)}`);
                            } catch (error) {
                                console.error(error);
                                alert('Failed to start container');
                            }
                        }
                    }}>
                        <span>{'>'}{'<'}</span>
                        <span className="font-medium">Dev Container</span>
                    </div>
                )}
                <div className="px-2 flex items-center">
                    <span className="mr-4">main*</span>
                    <span className="mr-4">Ln 1, Col 1</span>
                    <span className="mr-4">UTF-8</span>
                    <span className="mr-4">{activeTab?.name.split('.').pop()?.toUpperCase() || 'TXT'}</span>
                    <span className="mr-4 hover:text-white cursor-pointer" onClick={() => setIsTerminalOpen(!isTerminalOpen)}>Terminal</span>

                    {/* Settings Controls */}
                    <span
                        className={`mr-2 cursor-pointer font-bold px-1 ${isDebug ? 'text-green-400' : 'text-gray-500'}`}
                        onClick={toggleDebug}
                        title="Toggle Debug Mode"
                    >
                        DEBUG
                    </span>
                    <span
                        className="mr-4 cursor-pointer text-red-400 hover:text-red-300 px-1"
                        onClick={resetSettings}
                        title="Reset All Settings"
                    >
                        RESET
                    </span>
                </div>
            </div>
        </div>
    )
}

export default App

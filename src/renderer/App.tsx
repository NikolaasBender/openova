import { useState } from 'react'
import Editor from './components/Editor'
import Sidebar from './components/Sidebar'
import WindowControls from './components/WindowControls'

function App() {
    const [activeFile, setActiveFile] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string>("// Select a file to view");

    const handleFileSelect = async (path: string) => {
        setActiveFile(path);
        try {
            const content = await window.electronAPI.readFile(path);
            setFileContent(content);
        } catch (e) {
            setFileContent("// Error reading file");
        }
    };

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
                <div className="w-12 bg-vscode-activity flex flex-col items-center py-4 border-r border-[#2b2b2b] shrink-0 z-20">
                    <div className="w-6 h-6 border-2 border-white mb-6 rounded-sm opacity-50 hover:opacity-100 cursor-pointer" title="Explorer" />
                    <div className="w-6 h-6 border-2 border-white mb-6 rounded-sm opacity-30 cursor-pointer" title="Search" />
                </div>

                {/* Sidebar */}
                <Sidebar onFileSelect={handleFileSelect} />

                {/* Main Editor Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
                    <div className="h-9 bg-[#2d2d2d] flex items-center px-4 text-sm border-b border-[#1e1e1e] shrink-0">
                        <span className="italic text-gray-400 text-xs">{activeFile ? activeFile : 'Welcome'}</span>
                    </div>
                    <div className="flex-1 relative">
                        <Editor content={fileContent} language={activeFile?.split('.').pop() || 'javascript'} />
                    </div>
                </div>
            </div>

            {/* Status Bar */}
            <div className="h-6 bg-vscode-statusbar w-full text-xs flex items-center px-2 z-30 select-none cursor-default shrink-0">
                <span className="mr-4">main*</span>
                <span className="mr-4">Ln 1, Col 1</span>
                <span className="mr-4">UTF-8</span>
                <span className="mr-4">{activeFile?.split('.').pop()?.toUpperCase() || 'TXT'}</span>
            </div>
        </div>
    )
}

export default App

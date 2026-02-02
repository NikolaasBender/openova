import React from 'react';

interface Tab {
    path: string;
    name: string;
    isDirty: boolean;
}

interface TabBarProps {
    tabs: Tab[];
    activeTabPath: string | null;
    onTabClick: (path: string) => void;
    onTabClose: (path: string, e: React.MouseEvent) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabPath, onTabClick, onTabClose }) => {
    return (
        <div className="flex h-9 bg-[#252526] overflow-x-auto border-b border-[#2b2b2b] shrink-0 no-scrollbar">
            {tabs.map((tab) => {
                const isActive = tab.path === activeTabPath;
                return (
                    <div
                        key={tab.path}
                        className={`
                            group flex items-center min-w-[120px] max-w-[200px] h-full px-3 text-sm cursor-pointer border-r border-[#252526] select-none
                            ${isActive ? 'bg-[#1e1e1e] text-white border-t border-t-[#007fd4]' : 'bg-[#2d2d2d] text-[#969696] hover:bg-[#2a2d2e]'}
                        `}
                        onClick={() => onTabClick(tab.path)}
                    >
                        <span className="truncate flex-1 mr-2">{tab.name}</span>
                        <div
                            className={`
                                w-5 h-5 flex items-center justify-center rounded-sm hover:bg-[#4b4b4b]
                                ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                            `}
                            onClick={(e) => {
                                e.stopPropagation();
                                onTabClose(tab.path, e);
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                            </svg>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TabBar;

import React, { useState, useRef, useEffect } from 'react';

interface MenuBarProps {
    onOpenFolder: () => void;
    onOpenSettings: () => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({ onOpenFolder, onOpenSettings }) => {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menus = {
        File: [
            { label: 'Open Folder...', action: onOpenFolder },
            { label: 'Exit', action: () => window.electronAPI?.close() }
        ],
        Settings: [
            { label: 'Open Settings JSON', action: onOpenSettings }
        ]
    };

    return (
        <div className="flex items-center h-full text-xs select-none" ref={menuRef}>
            {Object.entries(menus).map(([name, items]) => (
                <div key={name} className="relative z-50">
                    <div
                        className={`px-3 py-1 hover:bg-[#505050] cursor-pointer rounded-sm ${activeMenu === name ? 'bg-[#505050]' : ''}`}
                        onClick={() => setActiveMenu(activeMenu === name ? null : name)}
                    >
                        {name}
                    </div>
                    {activeMenu === name && (
                        <div className="absolute top-full left-0 bg-[#252526] shadow-xl border border-[#454545] min-w-[200px] py-1 rounded-sm">
                            {items.map((item, i) => (
                                <div
                                    key={i}
                                    className="px-4 py-1.5 hover:bg-[#094771] hover:text-white cursor-pointer flex justify-between group"
                                    onClick={() => {
                                        item.action();
                                        setActiveMenu(null);
                                    }}
                                >
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

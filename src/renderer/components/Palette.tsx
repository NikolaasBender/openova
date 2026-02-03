import React, { useState, useEffect, useRef } from 'react';

export interface PaletteItem {
    id: string;
    label: string;
    detail?: string;
    handler?: () => void;
}

interface PaletteProps {
    isOpen: boolean;
    mode: 'commands' | 'files';
    items: PaletteItem[];
    onClose: () => void;
    onSelect: (item: PaletteItem) => void;
    placeholder?: string;
}

const Palette: React.FC<PaletteProps> = ({ isOpen, mode, items, onClose, onSelect, placeholder }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const filteredItems = items.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        (item.detail && item.detail.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 100); // Limit results for performance

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen, mode]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
        // Scroll selected item into view
        if (listRef.current) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredItems[selectedIndex]) {
                onSelect(filteredItems[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-center pt-2" onClick={onClose}>
            <div
                className="w-[600px] max-h-[400px] bg-[#252526] shadow-2xl rounded-md flex flex-col border border-[#454545] text-[#cccccc]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-2 border-b border-[#454545]">
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full bg-[#3c3c3c] text-white px-2 py-1 outline-none border border-transparent focus:border-[#007fd4] placeholder-gray-500"
                        placeholder={placeholder || (mode === 'commands' ? '> Type a command' : 'Type file name...')}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredItems.length === 0 ? (
                        <div className="p-2 text-center text-gray-500">No results found</div>
                    ) : (
                        filteredItems.map((item, index) => (
                            <div
                                key={item.id}
                                className={`px-3 py-1 cursor-pointer flex justify-between items-center ${index === selectedIndex ? 'bg-[#04395e] text-white' : 'hover:bg-[#2a2d2e]'
                                    }`}
                                onClick={() => onSelect(item)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <span className="font-medium truncate mr-2">{item.label}</span>
                                {item.detail && <span className="text-xs opacity-70 truncate max-w-[50%]">{item.detail}</span>}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Palette;

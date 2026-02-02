import React from 'react';

interface ActivityBarProps {
    activeView: 'explorer' | 'extensions';
    onViewChange: (view: 'explorer' | 'extensions') => void;
}

const ActivityBar: React.FC<ActivityBarProps> = ({ activeView, onViewChange }) => {
    return (
        <div className="w-12 bg-vscode-activity flex flex-col items-center py-4 border-r border-[#2b2b2b] shrink-0 z-20">
            <div
                className={`w-6 h-6 mb-6 cursor-pointer ${activeView === 'explorer' ? 'opacity-100 border-l-2 border-white' : 'opacity-50 hover:opacity-100'}`}
                onClick={() => onViewChange('explorer')}
                title="Explorer"
            >
                {/* Simple Files Icon SVG */}
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-6 h-6 p-0.5">
                    <path d="M13.5 3H8.5l-.5-.5h-4l-.5.5v10l.5.5h9.5l.5-.5v-10l-.5-.5zM3.5 13V4h4l.5.5h5.5v8.5H3.5z" />
                </svg>
            </div>

            <div
                className={`w-6 h-6 mb-6 cursor-pointer ${activeView === 'extensions' ? 'opacity-100 border-l-2 border-white' : 'opacity-50 hover:opacity-100'}`}
                onClick={() => onViewChange('extensions')}
                title="Extensions"
            >
                {/* Extensions Icon SVG (Blocks) */}
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-6 h-6 p-0.5">
                    <path d="M9 1h4l1 1v4l-1 1h-4l-1-1V2l1-1zm1 4h3V2h-3v3zM15 9h-4l-1 1v4l1 1h4l1-1v-4l-1-1zm-1 4h-3v-3h3v3zM5 11l-1-1H1l-1 1v4l1 1h4l1-1v-4zm-1 4H2v-3h2v3zM5 1L4 2v4l1 1h4l1-1V2l-1-1H5zm3 4H6V2h2v3z" />
                </svg>
            </div>

            <div className="w-6 h-6 rounded-sm opacity-30 cursor-pointer" title="Search (Coming Soon)">
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-6 h-6 p-0.5">
                    <path d="M15.7 14.3l-3.1-3.1C13.5 10 14 8.6 14 7c0-3.9-3.1-7-7-7S0 3.1 0 7s3.1 7 7 7c1.6 0 3-.5 4.2-1.4l3.1 3.1 1.4-1.4zM2 7c0-2.8 2.2-5 5-5s5 2.2 5 5-2.2 5-5 5-5-2.2-5-5z" />
                </svg>
            </div>
        </div>
    );
};

export default ActivityBar;

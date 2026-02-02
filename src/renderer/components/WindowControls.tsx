import React from 'react';

const WindowControls: React.FC = () => {
    return (
        <div className="flex items-center h-full titlebar-no-drag">
            <div
                className="w-10 h-full flex items-center justify-center hover:bg-[#ffffff20] cursor-pointer text-gray-400 hover:text-white"
                onClick={() => window.electronAPI.minimize()}
                title="Minimize"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 14H4v-2h16v2z" />
                </svg>
            </div>
            <div
                className="w-10 h-full flex items-center justify-center hover:bg-[#ffffff20] cursor-pointer text-gray-400 hover:text-white"
                onClick={() => window.electronAPI.maximize()}
                title="Maximize"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4h16v16H4V4zm2 2v12h12V6H6z" />
                </svg>
            </div>
            <div
                className="w-10 h-full flex items-center justify-center hover:bg-[#e81123] hover:text-white cursor-pointer text-gray-400"
                onClick={() => window.electronAPI.close()}
                title="Close"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
            </div>
        </div>
    );
};

export default WindowControls;

import React, { useEffect, useState } from 'react';

interface Action {
    label: string;
    handler: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
}

interface NotificationToastProps {
    title: string;
    message?: string;
    actions: Action[];
    onClose: () => void;
    isVisible: boolean;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ title, message, actions, onClose, isVisible }) => {
    const [render, setRender] = useState(isVisible);

    useEffect(() => {
        if (isVisible) setRender(true);
        else setTimeout(() => setRender(false), 300); // Animation cleanup
    }, [isVisible]);

    if (!render) return null;

    return (
        <div
            className={`fixed bottom-8 right-8 z-[100] bg-[#252526] border border-[#454545] shadow-xl rounded-md w-80 overflow-hidden transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        >
            <div className="flex justify-between items-start p-3 bg-[#3c3c3c] border-b border-[#2b2b2b]">
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {message && (
                <div className="p-3 text-xs text-[#cccccc]">
                    {message}
                </div>
            )}

            <div className="flex flex-wrap gap-2 p-3 bg-[#252526]">
                {actions.map((action, idx) => (
                    <button
                        key={idx}
                        onClick={() => { action.handler(); onClose(); }}
                        className={`px-3 py-1.5 text-xs rounded transition-colors flex-1 text-center whitespace-nowrap
                            ${action.variant === 'danger'
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : action.variant === 'secondary'
                                    ? 'bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white border border-[#454545]'
                                    : 'bg-[#007fd4] hover:bg-[#006bb3] text-white'
                            }`}
                    >
                        {action.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

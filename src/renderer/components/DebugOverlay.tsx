import React, { useEffect, useState } from 'react';
import { SettingsService } from '../services/SettingsService';

interface DebugKeyData {
    key: string;
    ctrl: boolean;
    meta: boolean;
    shift: boolean;
    alt: boolean;
    code: string;
}

export const DebugOverlay: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [lastKey, setLastKey] = useState<DebugKeyData | null>(null);
    const [history, setHistory] = useState<string[]>([]);

    useEffect(() => {
        const checkDebugMode = () => {
            setVisible(SettingsService.getInstance().isDebugMode());
        };

        // Check initially
        checkDebugMode();

        // Listen for debug keys
        const handleDebugKey = (e: Event) => {
            const data = (e as CustomEvent).detail as DebugKeyData;
            setLastKey(data);

            const modifiers = [];
            if (data.ctrl) modifiers.push('Ctrl');
            if (data.meta) modifiers.push('Meta');
            if (data.alt) modifiers.push('Alt');
            if (data.shift) modifiers.push('Shift');

            const keyStr = [...modifiers, data.key].join('+');
            setHistory(prev => [keyStr, ...prev].slice(0, 5)); // Keep last 5
        };

        window.addEventListener('debug:key', handleDebugKey);

        // Poll for debug mode changes or listen to an event if we had one?
        // For now, let's just rely on the toggle updating it, or check periodically.
        // A simple interval for now to react to external changes if any.
        const interval = setInterval(checkDebugMode, 1000);

        return () => {
            window.removeEventListener('debug:key', handleDebugKey);
            clearInterval(interval);
        };
    }, []);

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: '#0f0',
            padding: '10px',
            borderRadius: '5px',
            fontFamily: 'monospace',
            zIndex: 9999,
            pointerEvents: 'none' // Let clicks pass through
        }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Debug Mode</div>
            {lastKey && (
                <div>
                    Last Code: {lastKey.code}<br />
                    Last Key: {lastKey.key}
                </div>
            )}
            <hr style={{ borderColor: '#333' }} />
            <div style={{ fontSize: '0.8em', opacity: 0.8 }}>
                {history.map((h, i) => <div key={i}>{h}</div>)}
            </div>
        </div>
    );
};

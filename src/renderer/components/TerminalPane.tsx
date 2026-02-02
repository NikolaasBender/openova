import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalPaneProps {
    className?: string;
    cwd?: string;
}

const TerminalPane: React.FC<TerminalPaneProps> = ({ className, cwd }) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const pidRef = useRef<number | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!terminalRef.current) return;

        // Initialize xterm
        const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: '#1e1e1e',
                foreground: '#cccccc'
            }
        });
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Create backend terminal
        const initTerminal = async () => {
            try {
                const pid = await window.electronAPI.terminal.create(cwd);
                pidRef.current = pid;
                setIsReady(true);

                // Handle data from terminal (user typing)
                term.onData(data => {
                    window.electronAPI.terminal.write(pid, data);
                });

                // Handle resize
                const handleResize = () => {
                    fitAddon.fit();
                    // We need to pass the new cols/rows to the backend
                    // fitAddon.proposeDimensions() returns the dimensions but we can just get them from term
                    if (term.cols && term.rows) {
                        window.electronAPI.terminal.resize(pid, term.cols, term.rows);
                    }
                };

                window.addEventListener('resize', handleResize);
                // Initial resize to sync backend
                handleResize();

                // Listen for incoming data from backend
                const cleanupListener = window.electronAPI.terminal.onIncoming(({ pid: incomingPid, data }) => {
                    if (incomingPid === pid) {
                        term.write(data);
                    }
                });

                return () => {
                    window.removeEventListener('resize', handleResize);
                    cleanupListener();
                    window.electronAPI.terminal.dispose(pid);
                };

            } catch (err) {
                console.error('Failed to create terminal:', err);
                term.write('\r\nFailed to calculate terminal backend.\r\n');
            }
        };

        const cleanupPromise = initTerminal();

        return () => {
            cleanupPromise.then(cleanup => cleanup && cleanup());
            term.dispose();
        };
    }, [cwd]); // Re-run if cwd changes

    // Observer to refit when container size changes (e.g. toggling sidebar)
    useEffect(() => {
        if (!terminalRef.current || !fitAddonRef.current || !pidRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            if (fitAddonRef.current && xtermRef.current && pidRef.current) {
                fitAddonRef.current.fit();
                const { cols, rows } = xtermRef.current;
                window.electronAPI.terminal.resize(pidRef.current, cols, rows);
            }
        });

        resizeObserver.observe(terminalRef.current);

        return () => resizeObserver.disconnect();
    }, [isReady]);

    return (
        <div
            className={`h-full w-full bg-[#1e1e1e] ${className}`}
            ref={terminalRef}
            style={{ padding: '0px 0px 0px 10px' }} // Slight padding
        />
    );
};

export default TerminalPane;

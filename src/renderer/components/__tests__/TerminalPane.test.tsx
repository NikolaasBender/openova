import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TerminalPane from '../TerminalPane';

// Mock xterm
vi.mock('xterm', () => {
    const TerminalMock = vi.fn(function () {
        return {
            loadAddon: vi.fn(),
            open: vi.fn(),
            onData: vi.fn(),
            write: vi.fn(),
            dispose: vi.fn(),
            cols: 80,
            rows: 24,
        };
    });
    return { Terminal: TerminalMock };
});

vi.mock('xterm-addon-fit', () => {
    const FitAddonMock = vi.fn(function () {
        return {
            fit: vi.fn(),
        };
    });
    return { FitAddon: FitAddonMock };
});

// Mock ResizeObserver
(global as any).ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock electronAPI
const terminalMock = {
    create: vi.fn(),
    write: vi.fn(),
    resize: vi.fn(),
    onIncoming: vi.fn(() => vi.fn()), // returns cleanup
    dispose: vi.fn(),
};

(window as any).electronAPI = {
    terminal: terminalMock
};

describe('TerminalPane', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('renders and initializes terminal', async () => {
        terminalMock.create.mockResolvedValue(123);

        render(<TerminalPane />);

        // Wait for init
        await waitFor(() => {
            expect(terminalMock.create).toHaveBeenCalled();
        });

        expect(terminalMock.onIncoming).toHaveBeenCalled();
    });

    it('creates terminal with cwd', async () => {
        terminalMock.create.mockResolvedValue(124);
        render(<TerminalPane cwd="/test/dir" />);

        await waitFor(() => {
            expect(terminalMock.create).toHaveBeenCalledWith('/test/dir');
        });
    });
});

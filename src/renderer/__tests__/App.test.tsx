import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

// Mock child components to isolate App logic
vi.mock('../components/Editor', () => ({ default: () => <div data-testid="mock-editor" /> }));
vi.mock('../components/ExplorerPane', () => ({ default: () => <div data-testid="mock-explorer" /> }));
vi.mock('../components/ExtensionsPane', () => ({ default: () => <div data-testid="mock-extensions" /> }));
vi.mock('../components/ActivityBar', () => ({ default: ({ onViewChange }: any) => <div data-testid="mock-activity-bar" onClick={() => onViewChange('extensions')} /> }));
vi.mock('../components/WindowControls', () => ({ default: () => <div data-testid="mock-window-controls" /> }));
vi.mock('../components/TerminalPane', () => ({ default: () => <div data-testid="mock-terminal" /> }));
vi.mock('../components/TabBar', () => ({ default: () => <div data-testid="mock-tab-bar" /> }));

// Mock electronAPI
const checkDevContainerMock = vi.fn();
const startDevContainerMock = vi.fn();
const readFileMock = vi.fn();

(window as any).electronAPI = {
    checkDevContainer: checkDevContainerMock,
    startDevContainer: startDevContainerMock,
    readFile: readFileMock,
};

describe('App', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        checkDevContainerMock.mockResolvedValue(null);
    });

    it('renders main layout', async () => {
        render(<App />);
        expect(screen.getByText('OpenOva - VS Code Clone')).toBeInTheDocument();
        expect(screen.getByTestId('mock-activity-bar')).toBeInTheDocument();
        // Default view is explorer
        expect(screen.getByTestId('mock-explorer')).toBeInTheDocument();
        expect(screen.getByTestId('mock-editor')).toBeInTheDocument();
        expect(screen.getByTestId('mock-terminal')).toBeInTheDocument();
        expect(screen.getByTestId('mock-window-controls')).toBeInTheDocument();
    });

    it('toggles sidebar view', async () => {
        render(<App />);
        const activityBar = screen.getByTestId('mock-activity-bar');
        fireEvent.click(activityBar); // Triggers onViewChange('extensions') based on our mock

        expect(screen.getByTestId('mock-extensions')).toBeInTheDocument();
        expect(screen.queryByTestId('mock-explorer')).not.toBeInTheDocument();
    });

    it('toggles terminal', () => {
        render(<App />);
        const terminalToggle = screen.getByText('Terminal');

        // Initial state: Open
        expect(screen.getByTestId('mock-terminal')).toBeInTheDocument();

        fireEvent.click(terminalToggle);
        expect(screen.queryByTestId('mock-terminal')).not.toBeInTheDocument();

        fireEvent.click(terminalToggle);
        expect(screen.getByTestId('mock-terminal')).toBeInTheDocument();
    });
});

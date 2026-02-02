import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WindowControls from '../WindowControls';

const minimizeMock = vi.fn();
const maximizeMock = vi.fn();
const closeMock = vi.fn();

(window as any).electronAPI = {
    minimize: minimizeMock,
    maximize: maximizeMock,
    close: closeMock,
};

describe('WindowControls', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('renders controls', () => {
        render(<WindowControls />);
        expect(screen.getByTitle('Minimize')).toBeInTheDocument();
        expect(screen.getByTitle('Maximize')).toBeInTheDocument();
        expect(screen.getByTitle('Close')).toBeInTheDocument();
    });

    it('calls electronAPI on click', () => {
        render(<WindowControls />);

        fireEvent.click(screen.getByTitle('Minimize').closest('div')!);
        expect(minimizeMock).toHaveBeenCalled();

        fireEvent.click(screen.getByTitle('Maximize').closest('div')!);
        expect(maximizeMock).toHaveBeenCalled();

        fireEvent.click(screen.getByTitle('Close').closest('div')!);
        expect(closeMock).toHaveBeenCalled();
    });
});

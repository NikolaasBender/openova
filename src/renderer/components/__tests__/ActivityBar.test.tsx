import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ActivityBar from '../ActivityBar';

describe('ActivityBar', () => {
    it('renders correct icons', () => {
        render(<ActivityBar activeView="explorer" onViewChange={() => { }} />);
        expect(screen.getByTitle('Explorer')).toBeInTheDocument();
        expect(screen.getByTitle('Extensions')).toBeInTheDocument();
        // expect(screen.getByTitle('Search (Coming Soon)')).toBeInTheDocument(); // Search is disabled/opacity 30
    });

    it('highlights active view', () => {
        const { rerender } = render(<ActivityBar activeView="explorer" onViewChange={() => { }} />);

        const explorerIcon = screen.getByTitle('Explorer').closest('div');
        const extensionsIcon = screen.getByTitle('Extensions').closest('div');

        expect(explorerIcon).toHaveClass('opacity-100');
        expect(extensionsIcon).toHaveClass('opacity-50');

        rerender(<ActivityBar activeView="extensions" onViewChange={() => { }} />);

        expect(screen.getByTitle('Explorer').closest('div')).toHaveClass('opacity-50');
        expect(screen.getByTitle('Extensions').closest('div')).toHaveClass('opacity-100');
    });

    it('calls onViewChange on click', () => {
        const onViewChange = vi.fn();
        render(<ActivityBar activeView="explorer" onViewChange={onViewChange} />);

        fireEvent.click(screen.getByTitle('Extensions'));
        expect(onViewChange).toHaveBeenCalledWith('extensions');

        fireEvent.click(screen.getByTitle('Explorer'));
        expect(onViewChange).toHaveBeenCalledWith('explorer');
    });
});

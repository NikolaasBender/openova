import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExtensionsPane from '../ExtensionsPane';
import { ExtensionService } from '../../services/ExtensionService';

// Mock ExtensionService
vi.mock('../../services/ExtensionService', () => ({
    ExtensionService: {
        searchExtensions: vi.fn(),
    }
}));

describe('ExtensionsPane', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('renders search input', () => {
        render(<ExtensionsPane width={250} />);
        expect(screen.getByPlaceholderText('Search Extensions in Marketplace')).toBeInTheDocument();
    });

    it('searches and displays extensions', async () => {
        const mockResults = [
            {
                namespace: 'test',
                name: 'ext1',
                version: '1.0',
                description: 'A test extension',
                files: { icon: 'icon.png' }
            }
        ];
        vi.mocked(ExtensionService.searchExtensions).mockResolvedValue(mockResults);

        render(<ExtensionsPane width={250} />);

        const input = screen.getByPlaceholderText('Search Extensions in Marketplace');
        fireEvent.change(input, { target: { value: 'test' } });
        fireEvent.submit(input.closest('form')!);

        await waitFor(() => {
            expect(screen.getByText('ext1')).toBeInTheDocument();
            expect(screen.getByText('A test extension')).toBeInTheDocument();
        });

        expect(ExtensionService.searchExtensions).toHaveBeenCalledWith('test');
    });

    it('handles empty results', async () => {
        vi.mocked(ExtensionService.searchExtensions).mockResolvedValue([]);

        render(<ExtensionsPane width={250} />);

        const input = screen.getByPlaceholderText('Search Extensions in Marketplace');
        fireEvent.change(input, { target: { value: 'empty' } });
        fireEvent.submit(input.closest('form')!);

        await waitFor(() => {
            expect(screen.getByText('No extensions found.')).toBeInTheDocument();
        });
    });

    it('simulates install', async () => {
        const mockResults = [
            {
                namespace: 'test',
                name: 'ext1',
                version: '1.0',
                files: {}
            }
        ];
        vi.mocked(ExtensionService.searchExtensions).mockResolvedValue(mockResults);

        render(<ExtensionsPane width={250} />);

        // Search first
        const input = screen.getByPlaceholderText('Search Extensions in Marketplace');
        fireEvent.change(input, { target: { value: 'test' } });
        fireEvent.submit(input.closest('form')!);

        await waitFor(() => expect(screen.getByText('ext1')).toBeInTheDocument());

        const installBtn = screen.getByText('Install');
        fireEvent.click(installBtn);

        expect(screen.getByText('Installed')).toBeInTheDocument();
        expect(screen.getByText('Installed')).toBeDisabled();
    });
});

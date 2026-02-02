import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExplorerPane from '../ExplorerPane';

// Mock electronAPI
const selectFolderMock = vi.fn();
const readDirectoryMock = vi.fn();
(window as any).electronAPI = {
    selectFolder: selectFolderMock,
    readDirectory: readDirectoryMock,
};

describe('ExplorerPane', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('renders "Open Folder" button when no rootPath', () => {
        render(
            <ExplorerPane
                onFileSelect={() => { }}
                rootPath={null}
                onRootPathChange={() => { }}
            />
        );
        expect(screen.getByText('Open Folder')).toBeInTheDocument();
    });

    it('loads files when rootPath is present', async () => {
        const mockFiles = [
            { name: 'file1.ts', isDirectory: false, path: '/root/file1.ts' },
            { name: 'dir1', isDirectory: true, path: '/root/dir1' }
        ];
        readDirectoryMock.mockResolvedValue(mockFiles);

        render(
            <ExplorerPane
                onFileSelect={() => { }}
                rootPath="/root"
                onRootPathChange={() => { }}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('file1.ts')).toBeInTheDocument();
            expect(screen.getByText('dir1')).toBeInTheDocument();
        });
        expect(readDirectoryMock).toHaveBeenCalledWith('/root');
    });

    it('handles open folder click', async () => {
        const onRootPathChange = vi.fn();
        selectFolderMock.mockResolvedValue('/new/path');
        readDirectoryMock.mockResolvedValue([]);

        render(
            <ExplorerPane
                onFileSelect={() => { }}
                rootPath={null}
                onRootPathChange={onRootPathChange}
            />
        );

        fireEvent.click(screen.getByText('Open Folder'));

        await waitFor(() => {
            expect(selectFolderMock).toHaveBeenCalled();
            expect(onRootPathChange).toHaveBeenCalledWith('/new/path');
        });
    });

    it('expands directory on click', async () => {
        const rootFiles = [
            { name: 'dir1', isDirectory: true, path: '/root/dir1' }
        ];
        const dirFiles = [
            { name: 'nested.ts', isDirectory: false, path: '/root/dir1/nested.ts' }
        ];

        readDirectoryMock.mockImplementation((path) => {
            if (path === '/root') return Promise.resolve(rootFiles);
            if (path === '/root/dir1') return Promise.resolve(dirFiles);
            return Promise.resolve([]);
        });

        render(
            <ExplorerPane
                onFileSelect={() => { }}
                rootPath="/root"
                onRootPathChange={() => { }}
            />
        );

        await waitFor(() => expect(screen.getByText('dir1')).toBeInTheDocument());

        fireEvent.click(screen.getByText('dir1'));

        await waitFor(() => {
            expect(screen.getByText('nested.ts')).toBeInTheDocument();
        });
        expect(readDirectoryMock).toHaveBeenCalledWith('/root/dir1');
    });
});

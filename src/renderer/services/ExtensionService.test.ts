import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExtensionService, Extension } from './ExtensionService';

// Mock electronAPI
const searchExtensionsMock = vi.fn();
(window as any).electronAPI = {
    searchExtensions: searchExtensionsMock
};

describe('ExtensionService', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('searchExtensions', () => {
        it('should return empty array if query is empty', async () => {
            const result = await ExtensionService.searchExtensions('');
            expect(result).toEqual([]);
            expect(searchExtensionsMock).not.toHaveBeenCalled();
        });

        it('should call electronAPI.searchExtensions with query', async () => {
            const mockExtensions: Extension[] = [{
                namespace: 'test',
                name: 'ext',
                version: '1.0.0',
                files: {}
            }];
            searchExtensionsMock.mockResolvedValue(mockExtensions);

            const result = await ExtensionService.searchExtensions('python');
            expect(searchExtensionsMock).toHaveBeenCalledWith('python');
            expect(result).toEqual(mockExtensions);
        });

        it('should return empty array on error', async () => {
            searchExtensionsMock.mockRejectedValue(new Error('Search failed'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const result = await ExtensionService.searchExtensions('error');
            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith('Extension search error:', expect.any(Error));

            consoleSpy.mockRestore();
        });
    });

    describe('getExtensionDetails', () => {
        it('should return extension details on success', async () => {
            const mockExt: Extension = {
                namespace: 'foo',
                name: 'bar',
                version: '1.0.0',
                files: {}
            };
            const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                json: async () => mockExt
            } as Response);

            const result = await ExtensionService.getExtensionDetails('foo', 'bar');
            expect(fetchMock).toHaveBeenCalledWith('https://open-vsx.org/api/foo/bar');
            expect(result).toEqual(mockExt);
        });

        it('should return null if response is not ok', async () => {
            const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
                ok: false
            } as Response);

            const result = await ExtensionService.getExtensionDetails('foo', 'bar');
            expect(result).toBeNull();
        });

        it('should return null on fetch error', async () => {
            const fetchMock = vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const result = await ExtensionService.getExtensionDetails('foo', 'bar');
            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Get extension details error:', expect.any(Error));

            consoleSpy.mockRestore();
        });
    });
});

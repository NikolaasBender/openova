import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as devContainer from '../devContainer';
import fs from 'fs/promises';
import { exec } from 'child_process';
import path from 'path';

vi.mock('fs/promises', () => ({
    default: {
        access: vi.fn(),
        readFile: vi.fn(),
    },
    access: vi.fn(), // If used as named import
    readFile: vi.fn(),
}));
vi.mock('child_process', async (importOriginal) => {
    // const actual = await importOriginal<typeof import('child_process')>();
    const execMock = vi.fn();
    return {
        // ...actual,
        exec: execMock,
        default: { exec: execMock },
    };
});

// Mock util.promisify by intercepting usage or just relying on how node works? 
// Actually since we mock exec, util.promisify(exec) will wrap the mock.
// But we need to make sure the callback style matches what promisify expects if we mock implementation.
// Or we can mock util.promisify too.
// Easier: Just mock child_process.exec to call the callback with (error, stdout, stderr).

describe('devContainer', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('findDevContainerConfig', () => {
        it('should return .devcontainer/devcontainer.json if it exists', async () => {
            const projectPath = '/test/project';
            const expectedPath = path.join(projectPath, '.devcontainer', 'devcontainer.json');

            vi.mocked(fs.access).mockImplementation(async (p) => {
                if (p === expectedPath) return;
                throw new Error('Not found');
            });

            const result = await devContainer.findDevContainerConfig(projectPath);
            expect(result).toBe(expectedPath);
        });

        it('should return .devcontainer.json if .devcontainer folder missing', async () => {
            const projectPath = '/test/project';
            const expectedPath = path.join(projectPath, '.devcontainer.json');

            vi.mocked(fs.access).mockImplementation(async (p) => {
                if (p === expectedPath) return;
                throw new Error('Not found');
            });

            const result = await devContainer.findDevContainerConfig(projectPath);
            expect(result).toBe(expectedPath);
        });

        it('should return null if neither exists', async () => {
            vi.mocked(fs.access).mockRejectedValue(new Error('Not found'));

            const result = await devContainer.findDevContainerConfig('/foo');
            expect(result).toBeNull();
        });
    });

    describe('parseDevContainer', () => {
        it('should parse valid JSON', async () => {
            const projectPath = '/test';
            // Setup finding logic
            const configPath = path.join(projectPath, '.devcontainer.json');
            vi.mocked(fs.access).mockImplementation(async (p) => {
                if (p === configPath) return;
                throw new Error('Not found');
            });

            vi.mocked(fs.readFile).mockResolvedValue('{"image": "node:18"}');

            const result = await devContainer.parseDevContainer(projectPath);
            expect(result).toEqual({ image: 'node:18' });
        });

        it('should strip comments (JSONC)', async () => {
            const projectPath = '/test';
            const configPath = path.join(projectPath, '.devcontainer.json');
            vi.mocked(fs.access).mockImplementation(async (p) => {
                if (p === configPath) return;
                throw new Error('Not found');
            });

            vi.mocked(fs.readFile).mockResolvedValue(`{
                 // This is a comment
                 "image": "node:18" /* block comment */
             }`);

            const result = await devContainer.parseDevContainer(projectPath);
            expect(result).toEqual({ image: 'node:18' });
        });
    });

    // Note: Testing startDevContainer requires mocking exec correctly.
    // Since util.promisify is used, we need to ensure the mock calls the callback.
    describe('startDevContainer', () => {
        it('should start container with image', async () => {
            const projectPath = '/test/project';
            const config = { image: 'node:18' };

            // Mock exec to succeed
            (exec as unknown as ReturnType<typeof vi.fn>).mockImplementation((cmd, callback) => {
                // Simulate success
                callback(null, { stdout: 'container123\n', stderr: '' });
                return {} as any; // child process object
            });

            const result = await devContainer.startDevContainer(projectPath, config);
            expect(result).toBe('container123');
            expect(exec).toHaveBeenCalledWith(
                expect.stringContaining('docker run'),
                expect.any(Function)
            );
        });
    });
});

import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        exclude: ['node_modules', 'dist', 'dist-electron', '.git', '.idea'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            all: true,
            include: ['src/**/*.ts', 'src/**/*.tsx'],
            exclude: [
                'node_modules/',
                'dist/',
                'dist-electron/',
                '**/*.d.ts',
                '**/*.config.ts',
                'src/test/',
            ],
        },
    },
}))

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KeybindingService } from '../KeybindingService';

describe('KeybindingService Reproduction', () => {
    let service: KeybindingService;

    beforeEach(() => {
        service = KeybindingService.getInstance();
        (service as any).bindings.clear();
        // Since we disposed in previous test, we need to re-add listener if it's missing?
        // Actually, easiest is to NOT dispose in afterEach, but we should cleaning up.
        // Let's just re-initialize if needed or hack it.
        // Better: Don't call dispose in tests, just clear bindings.
    });

    // afterEach(() => {
    //    service.dispose();
    // });

    it('should match Ctrl+Shift+P when key is "P"', () => {
        const handler = vi.fn();
        service.register('workbench.action.showCommands', 'Ctrl+Shift+p', handler);

        const event = new KeyboardEvent('keydown', {
            key: 'P',
            code: 'KeyP',
            ctrlKey: true,
            shiftKey: true,
            bubbles: true
        });

        window.dispatchEvent(event);
        expect(handler).toHaveBeenCalled();
    });

    it('should match Ctrl+Shift+P when key is "p" and shift is true', () => {
        const handler = vi.fn();
        service.register('workbench.action.showCommands', 'Ctrl+Shift+p', handler);

        const event = new KeyboardEvent('keydown', {
            key: 'p',
            code: 'KeyP',
            ctrlKey: true,
            shiftKey: true,
            bubbles: true
        });

        window.dispatchEvent(event);
        expect(handler).toHaveBeenCalled();
    });

    it('should match Ctrl+P when key is "p"', () => {
        const handler = vi.fn();
        service.register('workbench.action.quickOpen', 'Ctrl+p', handler);

        const event = new KeyboardEvent('keydown', {
            key: 'p',
            code: 'KeyP',
            ctrlKey: true,
            shiftKey: false,
            bubbles: true
        });

        window.dispatchEvent(event);
        expect(handler).toHaveBeenCalled();
    });
});

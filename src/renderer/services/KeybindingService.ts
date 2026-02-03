import { SettingsService } from './SettingsService';

export type KeybindingHandler = (e: KeyboardEvent) => void;

interface IKeybinding {
    id: string;
    accelerator: string; // e.g. "Ctrl+S", "Ctrl+Shift+P"
    handler: KeybindingHandler;
    context?: string; // Optional context, e.g. "editor", "terminal" (not yet implemented fully)
}

export class KeybindingService {
    private static instance: KeybindingService;
    private bindings: Map<string, IKeybinding> = new Map();
    private isPaused: boolean = false;

    private constructor() {
        this.handleKeyDown = this.handleKeyDown.bind(this);
        // Use capture phase to ensure we intercept shortcuts before focused elements (like the editor) consume them
        window.addEventListener('keydown', this.handleKeyDown, true);
        console.log('KeybindingService initialized');
        if (window.electronAPI && window.electronAPI.log) {
            window.electronAPI.log('KeybindingService initialized');
        }
    }

    public static getInstance(): KeybindingService {
        if (!KeybindingService.instance) {
            KeybindingService.instance = new KeybindingService();
        }
        return KeybindingService.instance;
    }

    public register(id: string, accelerator: string, handler: KeybindingHandler) {
        this.bindings.set(id, { id, accelerator, handler });
    }

    public unregister(id: string) {
        this.bindings.delete(id);
    }

    public pause() {
        this.isPaused = true;
    }

    public resume() {
        this.isPaused = false;
    }

    public static parseAccelerator(accelerator: string): {
        ctrl: boolean;
        shift: boolean;
        alt: boolean;
        meta: boolean;
        key: string;
    } {
        const parts = accelerator.toLowerCase().split('+');
        const key = parts.pop() || '';
        const modifiers = new Set(parts);

        return {
            ctrl: modifiers.has('ctrl') || modifiers.has('cmd') || modifiers.has('control'), // Treat cmd/ctrl same for now on web/electron generic
            // On mac 'meta' is cmd. We might need platform specific detection later.
            // For now, let's treat 'ctrl' as primary modifier.
            // Actually, let's be more specific. 'CmdOrCtrl' is common in Electron.

            // Re-evaluating based on Electron standards or web standards:
            // "Ctrl" usually maps to e.ctrlKey.
            // "Cmd" usually maps to e.metaKey.
            // "Shift" -> e.shiftKey
            // "Alt" -> e.altKey

            shift: modifiers.has('shift'),
            alt: modifiers.has('alt'),
            meta: modifiers.has('meta') || modifiers.has('cmd') || modifiers.has('super'),
            key: key
        };
    }

    private handleKeyDown(e: KeyboardEvent) {
        if (this.isPaused) return;

        // Check debug mode from SettingsService
        if (SettingsService.getInstance().isDebugMode()) {
            const debugData = {
                key: e.key,
                ctrl: e.ctrlKey,
                meta: e.metaKey, // TODO: Platform check?
                shift: e.shiftKey,
                alt: e.altKey,
                code: e.code
            };
            window.dispatchEvent(new CustomEvent('debug:key', { detail: debugData }));
        }

        const msg = `[KeybindingService] KeyDown: code=${e.code}, key=${e.key}, ctrl=${e.ctrlKey}, meta=${e.metaKey}, shift=${e.shiftKey}, alt=${e.altKey}`;
        console.log(msg);
        if (window.electronAPI && window.electronAPI.log) {
            window.electronAPI.log(msg);
        }


        // Iterate bindings and check for match
        // Note: This is O(N) search. For many bindings, a trie or map by key would be better.
        // Given we have ~10 bindings, this is fine.

        for (const binding of this.bindings.values()) {
            if (this.matches(e, binding.accelerator)) {
                console.log(`[KeybindingService] Match found for ${binding.id}`);
                // Prevent default if matched? Usually yes for app shortcuts.
                // We'll let the handler decide if it wants to prevent default, 
                // OR we presume that if it matches a registered shortcut, we catch it.
                // Let's prevent default here to stop browser actions (like Ctrl+S saving page)
                e.preventDefault();
                e.stopPropagation();
                binding.handler(e);
                return;
            }
        }
    }

    private matches(e: KeyboardEvent, accelerator: string): boolean {
        const parsed = KeybindingService.parseAccelerator(accelerator);

        // Check modifiers
        // Note: e.ctrlKey is true if Control is pressed.
        // On macOS, usually Cmd is used for shortcuts.
        // Let's assume the user might define bindings with "Ctrl" meaning Command on Mac.
        // But for strict parsing:

        // A simple normalization for "mod" or "cmdorctrl" could be added.
        // For now, strict matching.

        const isCtrl = e.ctrlKey;
        const isMeta = e.metaKey;
        const isShift = e.shiftKey;
        const isAlt = e.altKey;

        // Check key
        // e.key is Case Sensitive for printed characters (e.g. "S" or "s").
        // Usually shortcuts are case insensitive (Ctrl+S).
        // Exceptions: Ctrl+Shift+S - e.key might be "S".

        const pressedKey = e.key.toLowerCase();

        // Special case handling for space, etc if needed.

        if (parsed.key !== pressedKey) return false;

        // Exact modifier match
        if (parsed.ctrl !== isCtrl) return false;
        if (parsed.meta !== isMeta) return false;
        if (parsed.alt !== isAlt) return false;
        if (parsed.shift !== isShift) return false;

        return true;
    }

    public dispose() {
        window.removeEventListener('keydown', this.handleKeyDown, true);
    }
}

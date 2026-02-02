import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CodeEditor from '../Editor';

// Mock @monaco-editor/react
vi.mock('@monaco-editor/react', () => {
    return {
        default: ({ value, onChange }: any) => {
            return (
                <textarea
                    data-testid="monaco-editor"
                    value={value}
                    onChange={e => onChange?.(e.target.value)}
                />
            );
        },
        useMonaco: () => ({
            languages: {
                typescript: {
                    javascriptDefaults: {
                        setDiagnosticsOptions: vi.fn(),
                    }
                }
            }
        })
    };
});

describe('Editor', () => {
    it('renders editor with content', () => {
        render(<CodeEditor content="console.log('hello')" />);
        const editor = screen.getByTestId('monaco-editor');
        expect(editor).toBeInTheDocument();
        expect(editor).toHaveValue("console.log('hello')");
    });

    // Test onChange if possible through the mock
    it('calls onChange', () => {
        const onChange = vi.fn();
        render(<CodeEditor content="" onChange={onChange} />);
        const editor = screen.getByTestId('monaco-editor');

        // Simulate change
        // Since we mocked it as a textarea, we can fire change event
        // But our mock component calls onChange(e.target.value)
        // So fireEvent.change

        const { fireEvent } = require('@testing-library/react');
        fireEvent.change(editor, { target: { value: 'new content' } });

        expect(onChange).toHaveBeenCalledWith('new content');
    });
});

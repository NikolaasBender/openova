import React from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';

interface EditorProps {
    content: string;
    language?: string;
}

const CodeEditor: React.FC<EditorProps> = ({ content, language = 'javascript' }) => {
    const monaco = useMonaco();

    React.useEffect(() => {
        if (monaco) {
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: true,
                noSyntaxValidation: false,
            });
        }
    }, [monaco]);

    return (
        <Editor
            height="100%"
            language={language}
            value={content}
            theme="vs-dark"
            options={{
                minimap: { enabled: true },
                fontSize: 14,
                fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
                scrollBeyondLastLine: false,
                automaticLayout: true,
            }}
        />
    );
};

export default CodeEditor;

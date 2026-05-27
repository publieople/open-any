import { useRef, useEffect, useState, useCallback } from 'react';
import type { FileTab, FileHandler } from '../registry/types';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown as markdownLang } from '@codemirror/lang-markdown';
import { yaml } from '@codemirror/lang-yaml';
import { rust } from '@codemirror/lang-rust';
import { oneDark } from '@codemirror/theme-one-dark';

const extensionLanguageMap: Record<string, () => ReturnType<typeof javascript>> = {
  py: () => python(),
  js: () => javascript(),
  jsx: () => javascript({ jsx: true }),
  ts: () => javascript({ typescript: true }),
  tsx: () => javascript({ jsx: true, typescript: true }),
  html: () => html(),
  htm: () => html(),
  css: () => css(),
  json: () => json(),
  md: () => markdownLang(),
  mdx: () => markdownLang(),
  yaml: () => yaml(),
  yml: () => yaml(),
  rs: () => rust(),
};

function getLanguageExtension(ext: string) {
  const key = ext.toLowerCase().replace(/^\./, '');
  const factory = extensionLanguageMap[key];
  return factory ? factory() : [];
}

interface TextEditorProps {
  file: FileTab;
  onSave?: (fileId: string, buffer: ArrayBuffer) => void;
  readOnly?: boolean;
}

function TextEditor({ file, onSave, readOnly = false }: TextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const contentRef = useRef(file.text ?? '');

  useEffect(() => {
    if (!editorRef.current) return;

    const content = file.text ?? '';
    contentRef.current = content;
    setIsDirty(false);

    const langExt = getLanguageExtension(file.extension);

    const view = new EditorView({
      doc: content,
      extensions: [
        basicSetup,
        oneDark,
        langExt,
        EditorView.editable.of(!readOnly),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            contentRef.current = update.state.doc.toString();
            setIsDirty(true);
          }
        }),
      ],
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [file.id, file.extension, readOnly]);

  const handleSave = useCallback(() => {
    if (!onSave || !isDirty) return;
    const encoder = new TextEncoder();
    const buffer = encoder.encode(contentRef.current).buffer;
    onSave(file.id, buffer);
    setIsDirty(false);
  }, [onSave, isDirty, file.id]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1e1e] border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono">
          {file.name}
        </span>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className={`text-xs px-2.5 py-1 rounded ${
                isDirty
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isDirty ? 'Save' : 'Saved'}
            </button>
          )}
        </div>
      </div>
      <div ref={editorRef} className="flex-1 overflow-auto" />
    </div>
  );
}

export const handler: FileHandler = {
  id: 'text',
  name: 'Text Editor',
  extensions: [
    'txt', 'md', 'mdx',
    'py', 'js', 'jsx', 'ts', 'tsx',
    'html', 'htm', 'css',
    'json', 'xml', 'svg',
    'yaml', 'yml', 'toml',
    'rs', 'go', 'java', 'rb', 'php',
    'sh', 'bash', 'zsh',
    'sql', 'r', 'lua',
  ],
  mimeTypes: [
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'application/json',
    'application/xml',
  ],
  canEdit: true,
  Viewer: (props) => <TextEditor {...props} readOnly={true} />,
  Editor: (props) => <TextEditor {...props} readOnly={false} />,
};

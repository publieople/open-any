import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { FileTab, FileHandler } from '../registry/types';
import { EditorView, basicSetup } from 'codemirror';
import { xml } from '@codemirror/lang-xml';
import { oneDark } from '@codemirror/theme-one-dark';

// ---------------------------------------------------------------------------
// SVG handler: dual mode — rendered preview + source code editing
// ---------------------------------------------------------------------------

type Mode = 'preview' | 'code';

interface SvgViewerProps {
  file: FileTab;
  onSave?: (fileId: string, buffer: ArrayBuffer) => void;
  readOnly?: boolean;
}

function SvgViewer({ file, onSave, readOnly = false }: SvgViewerProps) {
  const [mode, setMode] = useState<Mode>('preview');
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const contentRef = useRef(file.text ?? '');

  // ---- Build data URL for preview mode ----
  const previewUrl = useMemo(() => {
    const text = file.text ?? '';
    const encoded = encodeURIComponent(text);
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  }, [file.id, file.text]);

  // ---- CodeMirror editor (code mode only) ----
  useEffect(() => {
    if (mode !== 'code' || !editorRef.current) {
      return;
    }

    const content = file.text ?? '';
    contentRef.current = content;
    setIsDirty(false);

    const view = new EditorView({
      doc: content,
      extensions: [
        basicSetup,
        oneDark,
        xml(),
        EditorView.editable.of(!readOnly),
        EditorView.updateListener.of((update: { docChanged: boolean; state: { doc: { toString: () => string } } }) => {
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
    // Re-create editor when switching modes, file id changes, or readOnly flips
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, file.id, readOnly]);

  // ---- Save handler ----
  const handleSave = useCallback(() => {
    if (!onSave || !isDirty) return;
    const encoder = new TextEncoder();
    const buffer = encoder.encode(contentRef.current).buffer;
    onSave(file.id, buffer);
    setIsDirty(false);
  }, [onSave, isDirty, file.id]);

  // ---- Toggle mode ----
  const toggleMode = useCallback(() => {
    setMode((prev: Mode): Mode => (prev === 'preview' ? 'code' : 'preview'));
  }, []);

  const isPreviewMode = mode === 'preview';

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1e1e] border-b border-gray-700 shrink-0 z-10">
        <span className="text-xs text-gray-400 font-mono">{file.name}</span>
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <button
            onClick={toggleMode}
            className="text-xs px-2.5 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
          >
            {isPreviewMode ? 'Edit Code' : 'Preview'}
          </button>

          {/* Save button — only in code mode when dirty */}
          {!readOnly && mode === 'code' && (
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

      {/* Content area */}
      {isPreviewMode ? (
        <div className="flex-1 flex items-center justify-center bg-[#1a1a2e] p-4 overflow-auto">
          <img
            src={previewUrl}
            alt={file.name}
            className="max-w-full max-h-full object-contain"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              // If SVG fails to render, show the error state
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div ref={editorRef} className="flex-1 overflow-auto" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FileHandler export
// ---------------------------------------------------------------------------

export const handler: FileHandler = {
  id: 'svg',
  name: 'SVG Viewer',
  extensions: ['svg'],
  mimeTypes: ['image/svg+xml'],
  canEdit: true,
  Viewer: (props) => <SvgViewer {...props} readOnly={true} />,
  Editor: (props) => <SvgViewer {...props} readOnly={false} />,
};

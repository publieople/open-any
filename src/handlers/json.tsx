import { useRef, useEffect, useState, useCallback } from 'react';
import type { FileTab, FileHandler } from '../registry/types';
import { createJSONEditor, Mode } from 'vanilla-jsoneditor';
import type { Content } from 'vanilla-jsoneditor';

function JsonEditor({
  file,
  onSave,
  readOnly = false,
}: {
  file: FileTab;
  onSave?: (fileId: string, buffer: ArrayBuffer) => void;
  readOnly?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<ReturnType<typeof createJSONEditor> | null>(null);
  const [mode, setMode] = useState<Mode>(Mode.tree);
  const contentRef = useRef<Content | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let content: Content;
    try {
      const text = file.text ?? '';
      content = text ? { json: JSON.parse(text) } : { json: null };
    } catch {
      content = { text: file.text ?? '' };
    }
    contentRef.current = content;

    const editor = createJSONEditor({
      target: containerRef.current,
      props: {
        content,
        mode: readOnly ? Mode.tree : mode,
        readOnly,
        mainMenuBar: false,
        navigationBar: false,
        statusBar: false,
        onChange: (newContent: Content) => {
          contentRef.current = newContent;
        },
      },
    });

    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, [file.id, readOnly]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateProps({ mode });
    }
  }, [mode]);

  const handleSave = useCallback(() => {
    if (!onSave || !contentRef.current) return;
    const content = contentRef.current;
    let jsonStr: string;
    if ('json' in content) {
      jsonStr = JSON.stringify(content.json, null, 2);
    } else {
      jsonStr = (content as { text: string }).text;
    }
    const encoder = new TextEncoder();
    const buffer = encoder.encode(jsonStr).buffer as ArrayBuffer;
    onSave(file.id, buffer);
  }, [onSave, file.id]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1e1e] border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono">{file.name}</span>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
                className="text-xs bg-gray-700 text-gray-200 border border-gray-600 rounded px-2 py-1"
              >
                <option value={Mode.tree}>Tree</option>
                <option value={Mode.text}>Code</option>
              </select>
              <button
                onClick={handleSave}
                className="text-xs px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-500"
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-auto" />
    </div>
  );
}

export const handler: FileHandler = {
  id: 'json',
  name: 'JSON Editor',
  extensions: ['json'],
  mimeTypes: ['application/json'],
  canEdit: true,
  Viewer: (props) => <JsonEditor {...props} readOnly={true} />,
  Editor: (props) => <JsonEditor {...props} readOnly={false} />,
};

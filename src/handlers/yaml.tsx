import { useRef, useEffect, useState, useCallback } from 'react';
import type { FileTab, FileHandler } from '../registry/types';
import { createJSONEditor, Mode } from 'vanilla-jsoneditor';
import type { Content } from 'vanilla-jsoneditor';
import * as yaml from 'js-yaml';
import * as toml from '@iarna/toml';

function parseContent(text: string, ext: string): unknown {
  const key = ext.toLowerCase().replace(/^\./, '');
  if (key === 'toml') {
    return toml.parse(text);
  }
  // YAML: .yaml, .yml
  return yaml.load(text);
}

function stringifyContent(data: unknown, ext: string): string {
  const key = ext.toLowerCase().replace(/^\./, '');
  if (key === 'toml') {
    return (toml as unknown as { stringify: (data: Record<string, unknown>) => string }).stringify(data as Record<string, unknown>);
  }
  return yaml.dump(data, { indent: 2, noRefs: true });
}

interface YamlEditorProps {
  file: FileTab;
  onSave?: (fileId: string, buffer: ArrayBuffer) => void;
  readOnly?: boolean;
}

function YamlEditor({ file, onSave, readOnly = false }: YamlEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<ReturnType<typeof createJSONEditor> | null>(null);
  const [mode, setMode] = useState<Mode>(Mode.tree);
  const [parseError, setParseError] = useState<string | null>(null);
  const currentDataRef = useRef<unknown>(null);

  // Initialize or re-initialize when file changes
  useEffect(() => {
    if (!containerRef.current) return;

    setParseError(null);

    let parsed: unknown;
    try {
      parsed = parseContent(file.text ?? '', file.extension);
      currentDataRef.current = parsed;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setParseError(`Parse error: ${message}`);
      return;
    }

    // If editor already exists, just update content
    if (editorRef.current) {
      editorRef.current.set({ json: parsed });
      return;
    }

    const editor = createJSONEditor({
      target: containerRef.current,
      props: {
        content: { json: parsed },
        mode: Mode.tree,
        readOnly,
        mainMenuBar: false,
        navigationBar: false,
        statusBar: false,
        onChange: (newContent: Content) => {
          if ('json' in newContent) {
            currentDataRef.current = newContent.json;
          }
        },
      },
    });

    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, [file.id, file.text, file.extension, readOnly]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateProps({ mode });
    }
  }, [mode]);

  const handleSave = useCallback(() => {
    if (!onSave || currentDataRef.current === null) return;

    try {
      const output = stringifyContent(currentDataRef.current, file.extension);
      const encoder = new TextEncoder();
      const buffer = encoder.encode(output).buffer;
      onSave(file.id, buffer);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setParseError(`Serialize error: ${message}`);
    }
  }, [onSave, file.id, file.extension]);

  if (parseError) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1e1e] border-b border-gray-700">
          <span className="text-xs text-gray-400 font-mono">{file.name}</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-red-400 font-mono text-sm whitespace-pre-wrap">
            {parseError}
          </div>
        </div>
      </div>
    );
  }

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
  id: 'yaml',
  name: 'YAML/TOML Editor',
  extensions: ['yaml', 'yml', 'toml'],
  mimeTypes: [
    'application/x-yaml',
    'text/yaml',
    'text/vnd.yaml',
    'application/toml',
    'text/toml',
  ],
  canEdit: true,
  Viewer: (props) => <YamlEditor {...props} readOnly={true} />,
  Editor: (props) => <YamlEditor {...props} readOnly={false} />,
};

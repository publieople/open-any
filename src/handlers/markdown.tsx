import { useCallback, useRef, useEffect } from 'react';
import type { FileTab, FileHandler } from '../registry/types';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

function MarkdownEditor({
  file,
  onSave,
  readOnly = false,
}: {
  file: FileTab;
  onSave?: (fileId: string, buffer: ArrayBuffer) => void;
  readOnly?: boolean;
}) {
  const markdownRef = useRef(file.text ?? '');
  const isDirtyRef = useRef(false);

  useEffect(() => {
    markdownRef.current = file.text ?? '';
    isDirtyRef.current = false;
  }, [file.id, file.text]);

  const handleChange = useCallback(
    (markdown: string) => {
      markdownRef.current = markdown;
      isDirtyRef.current = true;
    },
    [],
  );

  const handleSave = useCallback(() => {
    if (!onSave || !isDirtyRef.current) return;
    const encoder = new TextEncoder();
    const buffer = encoder.encode(markdownRef.current).buffer;
    onSave(file.id, buffer);
    isDirtyRef.current = false;
  }, [onSave, file.id]);

  const plugins = [
    headingsPlugin(),
    listsPlugin(),
    markdownShortcutPlugin(),
    ...(readOnly
      ? []
      : [
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <BoldItalicUnderlineToggles />
              </>
            ),
          }),
        ]),
  ];

  return (
    <div className="flex flex-col h-full">
      {!readOnly && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1e1e] border-b border-gray-700">
          <span className="text-xs text-gray-400 font-mono">{file.name}</span>
          <button
            onClick={handleSave}
            className="text-xs px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-500"
          >
            Save
          </button>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <MDXEditor
          key={file.id}
          markdown={file.text ?? ''}
          onChange={handleChange}
          readOnly={readOnly}
          plugins={plugins}
          contentEditableClassName="prose prose-sm dark:prose-invert max-w-none p-4"
          className="h-full"
        />
      </div>
    </div>
  );
}

export const handler: FileHandler = {
  id: 'markdown',
  name: 'Markdown Editor',
  extensions: ['md', 'mdx', 'markdown'],
  mimeTypes: ['text/markdown', 'text/x-markdown'],
  canEdit: true,
  Viewer: (props) => <MarkdownEditor {...props} readOnly={true} />,
  Editor: (props) => <MarkdownEditor {...props} readOnly={false} />,
};

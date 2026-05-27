import { useRef, useEffect, useState, useCallback } from 'react';
import type { FileTab, FileHandler } from '../registry/types';
import ImageEditor from 'tui-image-editor';
import 'tui-image-editor/dist/tui-image-editor.css';

// ---------------------------------------------------------------------------
// Dark theme configuration for TUI Image Editor
// ---------------------------------------------------------------------------
const blackTheme: Record<string, string> = {
  'common.bi.image': '',
  'common.bisize.width': '0px',
  'common.bisize.height': '0px',
  'common.backgroundImage': 'none',
  'common.backgroundColor': '#1e1e1e',
  'common.border': '0px',

  // header
  'header.backgroundImage': 'none',
  'header.backgroundColor': '#2a2a2a',
  'header.border': '1px solid #3c3c3c',

  // load button
  'loadButton.backgroundColor': '#3c3c3c',
  'loadButton.border': '1px solid #555',
  'loadButton.color': '#ccc',
  'loadButton.fontFamily': 'sans-serif',
  'loadButton.fontSize': '12px',

  // download button
  'downloadButton.backgroundColor': '#3c3c3c',
  'downloadButton.border': '1px solid #555',
  'downloadButton.color': '#ccc',
  'downloadButton.fontFamily': 'sans-serif',
  'downloadButton.fontSize': '12px',

  // main icons
  'menu.normalIcon.color': '#8a8a8a',
  'menu.activeIcon.color': '#e9e9e9',
  'menu.disabledIcon.color': '#434343',
  'menu.hoverIcon.color': '#ffffff',
  'menu.iconSize.width': '24px',
  'menu.iconSize.height': '24px',

  // submenu
  'submenu.backgroundColor': '#2a2a2a',
  'submenu.partition.color': '#555555',
  'submenu.normalIcon.color': '#8a8a8a',
  'submenu.activeIcon.color': '#ffffff',
  'submenu.iconSize.width': '32px',
  'submenu.iconSize.height': '32px',
  'submenu.normalLabel.color': '#8a8a8a',
  'submenu.normalLabel.fontWeight': 'lighter',
  'submenu.activeLabel.color': '#ffffff',
  'submenu.activeLabel.fontWeight': 'lighter',

  // checkbox
  'checkbox.border': '1px solid #555',
  'checkbox.backgroundColor': '#3a3a3a',

  // range
  'range.pointer.color': '#ffffff',
  'range.bar.color': '#555',
  'range.subbar.color': '#888',
  'range.disabledPointer.color': '#414141',
  'range.disabledBar.color': '#282828',
  'range.disabledSubbar.color': '#414141',
  'range.value.color': '#ffffff',
  'range.value.fontWeight': 'lighter',
  'range.value.fontSize': '11px',
  'range.value.border': '1px solid #555',
  'range.value.backgroundColor': '#2a2a2a',
  'range.title.color': '#cccccc',
  'range.title.fontWeight': 'lighter',

  // colorpicker
  'colorpicker.button.border': '1px solid #555',
  'colorpicker.title.color': '#cccccc',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Supported export formats */
type ExportFormat = 'png' | 'jpeg' | 'webp';

/** MIME type lookup for export formats */
const formatMime: Record<ExportFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

/** Convert a data URL to an ArrayBuffer via fetch */
async function dataUrlToArrayBuffer(dataUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(dataUrl);
  return response.arrayBuffer();
}

/** Guess file name extension for the image name passed to the editor */
function getFileName(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------

type EditorInstance = InstanceType<typeof ImageEditor>;

function ImageEditorView({
  file,
  onSave,
  readOnly = false,
}: {
  file: FileTab;
  onSave?: (fileId: string, buffer: ArrayBuffer) => void;
  readOnly?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorInstance | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');

  // ---- Create blob URL from buffer ----
  useEffect(() => {
    const mimeType = file.extension === 'jpg' || file.extension === 'jpeg' ? 'image/jpeg'
      : file.extension === 'png' ? 'image/png'
      : file.extension === 'webp' ? 'image/webp'
      : file.extension === 'gif' ? 'image/gif'
      : file.extension === 'bmp' ? 'image/bmp'
      : 'image/png';

    const blob = new Blob([file.buffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [file.id, file.buffer, file.extension]);

  // ---- Create / update editor ----
  useEffect(() => {
    if (!containerRef.current || !blobUrlRef.current) return;

    // Destroy previous instance
    if (editorRef.current) {
      editorRef.current.destroy();
      editorRef.current = null;
    }

    const container = containerRef.current;

    const editor = new ImageEditor(container, {
      includeUI: {
        loadImage: {
          path: blobUrlRef.current,
          name: getFileName(file.name),
        },
        theme: blackTheme,
        menu: [
          'crop',
          'flip',
          'rotate',
          'draw',
          'shape',
          'icon',
          'text',
          'mask',
          'filter',
        ],
        initMenu: '',
        uiSize: {
          width: '100%',
          height: '100%',
        },
      },
      cssMaxWidth: 1920,
      cssMaxHeight: 1080,
      usageStatistics: false,
    });

    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
    // Intentionally only re-create when file.id or the blob URL changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id, blobUrlRef.current]);

  // ---- Save handler ----
  const handleSave = useCallback(async () => {
    if (!onSave || !editorRef.current) return;

    const editor = editorRef.current;
    const dataUrl = editor.toDataURL({
      format: exportFormat,
      quality: 1,
    });

    try {
      const buffer = await dataUrlToArrayBuffer(dataUrl);
      onSave(file.id, buffer);
    } catch (err) {
      console.error('Failed to export image:', err);
    }
  }, [onSave, file.id, exportFormat]);

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1e1e] border-b border-gray-700 shrink-0 z-10">
          <span className="text-xs text-gray-400 font-mono">{file.name}</span>
          <div className="flex items-center gap-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              className="text-xs bg-gray-700 text-gray-200 border border-gray-600 rounded px-2 py-1"
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
            </select>
            <button
              onClick={handleSave}
              className="text-xs px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-500"
            >
              Save
            </button>
          </div>
        </div>
      )}
      {/* Editor container */}
      <div ref={containerRef} className="flex-1 overflow-hidden" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// FileHandler export
// ---------------------------------------------------------------------------

export const handler: FileHandler = {
  id: 'image',
  name: 'Image Editor',
  extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'],
  mimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
  ],
  canEdit: true,
  Viewer: (props) => <ImageEditorView {...props} readOnly={true} />,
  Editor: (props) => <ImageEditorView {...props} readOnly={false} />,
};

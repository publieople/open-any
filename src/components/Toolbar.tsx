import { useCallback } from 'react';
import { Save, Download } from 'lucide-react';
import { useAppStore } from '../store';
import { useFileOps } from '../hooks/useFileOps';
import { detectByExtension } from '../utils/formatDetect';
import type { FileTab } from '../registry/types';

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  return `${size} ${units[i]}`;
}

export default function Toolbar() {
  const files = useAppStore((s) => s.files);
  const activeFileId = useAppStore((s) => s.activeFileId);
  const { saveFile } = useFileOps();

  const activeFile: FileTab | undefined = files.find(
    (f) => f.id === activeFileId,
  );

  const handleSave = useCallback(async () => {
    if (!activeFile) return;
    try {
      await saveFile(activeFile.id);
    } catch (err) {
      console.error('Save failed:', err);
    }
  }, [activeFile, saveFile]);

  const handleSaveAlt = useCallback(async () => {
    if (!activeFile) return;
    // Trigger a download as an alternative save method
    const blob = new Blob([activeFile.buffer]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activeFile]);

  if (!activeFile) return null;

  const format = detectByExtension(activeFile.extension);

  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-b border-slate-800">
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="font-medium text-slate-300 truncate max-w-[240px]" title={activeFile.name}>
          {activeFile.name}
        </span>
        <span className="text-slate-600">|</span>
        <span>{formatSize(activeFile.size)}</span>
        <span className="text-slate-600">|</span>
        <span className="uppercase">{format}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {activeFile.fileHandle && (
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors"
            title="保存到原文件"
          >
            <Save className="w-3.5 h-3.5" />
            <span>保存</span>
          </button>
        )}
        <button
          onClick={handleSaveAlt}
          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors"
          title="另存为..."
        >
          <Download className="w-3.5 h-3.5" />
          <span>下载</span>
        </button>
      </div>
    </div>
  );
}

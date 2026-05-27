import { useState, useCallback, type DragEvent } from 'react';
import { FolderOpen } from 'lucide-react';
import { useFileOps } from '../hooks/useFileOps';

export default function FilePicker() {
  const { openFileFromPicker, openFileFromDrop } = useFileOps();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const items = e.dataTransfer.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          await openFileFromDrop(item);
        }
      }
    },
    [openFileFromDrop],
  );

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          w-full max-w-xl h-72 flex flex-col items-center justify-center
          rounded-xl border-2 border-dashed transition-colors duration-200
          cursor-pointer select-none
          ${
            isDragOver
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900'
          }
        `}
        onClick={openFileFromPicker}
      >
        <FolderOpen className="w-12 h-12 text-slate-500 mb-4" />
        <p className="text-slate-300 text-lg font-medium mb-2">
          拖放文件到此处，或点击选择文件
        </p>
        <p className="text-slate-500 text-sm mb-6">
          支持多文件选择
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            openFileFromPicker();
          }}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          选择文件
        </button>
      </div>
    </div>
  );
}

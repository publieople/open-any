import { useCallback } from 'react';
import { File, FileJson, FileText, FileCode, X } from 'lucide-react';
import { useAppStore } from '../store';
import type { FileTab } from '../registry/types';

function getFileIcon(ext: string) {
  switch (ext) {
    case 'json':
    case 'jsonc':
      return FileJson;
    case 'md':
    case 'mdx':
    case 'markdown':
      return FileText;
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'py':
    case 'rs':
    case 'go':
      return FileCode;
    default:
      return File;
  }
}

function truncateName(name: string, maxLen = 20): string {
  if (name.length <= maxLen) return name;
  const ext = name.lastIndexOf('.');
  if (ext <= 0) return name.slice(0, maxLen - 3) + '...';
  const extension = name.slice(ext);
  const base = name.slice(0, ext);
  const maxBase = maxLen - extension.length - 3;
  if (maxBase <= 0) return name.slice(0, maxLen - 3) + '...';
  return base.slice(0, maxBase) + '...' + extension;
}

interface TabItemProps {
  file: FileTab;
  isActive: boolean;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

function TabItem({ file, isActive, onSelect, onClose }: TabItemProps) {
  const Icon = getFileIcon(file.extension);

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose(file.id);
    },
    [file.id, onClose],
  );

  return (
    <button
      onClick={() => onSelect(file.id)}
      className={`
        group flex items-center gap-1.5 px-3 py-2 text-xs
        border-r border-slate-800 min-w-0 shrink-0
        transition-colors duration-150
        ${
          isActive
            ? 'bg-slate-800 text-slate-100'
            : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
        }
      `}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate max-w-[160px]" title={file.name}>
        {truncateName(file.name)}
      </span>
      <span
        onClick={handleClose}
        className="ml-auto p-0.5 rounded hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </span>
    </button>
  );
}

export default function FileTabs() {
  const files = useAppStore((s) => s.files);
  const activeFileId = useAppStore((s) => s.activeFileId);
  const setActiveFile = useAppStore((s) => s.setActiveFile);
  const closeFile = useAppStore((s) => s.closeFile);

  if (files.length === 0) return null;

  return (
    <div className="flex items-center bg-slate-900 border-b border-slate-800 overflow-x-auto">
      {files.map((file) => (
        <TabItem
          key={file.id}
          file={file}
          isActive={file.id === activeFileId}
          onSelect={setActiveFile}
          onClose={closeFile}
        />
      ))}
    </div>
  );
}

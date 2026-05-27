import { useEffect, useCallback, useMemo } from 'react';
import { useAppStore, useHandlerStore } from './store';
import { handler as textHandler } from './handlers/text';
import { handler as jsonHandler } from './handlers/json';
import { handler as markdownHandler } from './handlers/markdown';
import { handler as yamlHandler } from './handlers/yaml';
import { handler as hexHandler } from './handlers/hex';
import FilePicker from './components/FilePicker';
import FileTabs from './components/FileTabs';
import Toolbar from './components/Toolbar';
import type { FileTab } from './registry/types';

function App() {
  const files = useAppStore((s) => s.files);
  const activeFileId = useAppStore((s) => s.activeFileId);
  const registerHandler = useHandlerStore((s) => s.registerHandler);
  const getHandler = useHandlerStore((s) => s.getHandler);
  const updateBuffer = useAppStore((s) => s.updateBuffer);

  // Register all handlers on mount
  useEffect(() => {
    registerHandler(textHandler);
    registerHandler(jsonHandler);
    registerHandler(markdownHandler);
    registerHandler(yamlHandler);
    registerHandler(hexHandler);
  }, [registerHandler]);

  const activeFile: FileTab | undefined = useMemo(
    () => files.find((f) => f.id === activeFileId),
    [files, activeFileId],
  );

  const handler = useMemo(() => {
    if (!activeFile) return null;
    return getHandler?.(activeFile.extension) ?? null;
  }, [activeFile, getHandler]);

  const handleSave = useCallback(
    (fileId: string, buffer: ArrayBuffer) => {
      updateBuffer(fileId, buffer);
    },
    [updateBuffer],
  );

  const hasOpenFiles = files.length > 0;

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top: File tabs */}
      <FileTabs />

      {/* Toolbar: shown when files are open */}
      {hasOpenFiles && <Toolbar />}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!hasOpenFiles ? (
          <FilePicker />
        ) : activeFile && handler ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {handler.canEdit && handler.Editor ? (
              <handler.Editor file={activeFile} onSave={handleSave} />
            ) : (
              <handler.Viewer file={activeFile} onSave={handleSave} />
            )}
          </div>
        ) : activeFile && !handler ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 text-lg mb-2">
                无法打开该文件类型
              </p>
              <p className="text-slate-600 text-sm">
                .{activeFile.extension} 格式暂不支持
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;

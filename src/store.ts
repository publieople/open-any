import { create } from 'zustand';
import type { FileTab, FileHandler } from './registry/types';
import { globalRegistry } from './registry/registry';

export interface AppStore {
  // State
  files: FileTab[];
  activeFileId: string | null;

  // Actions
  openFile: (file: FileTab) => void;
  closeFile: (id: string) => void;
  setActiveFile: (id: string) => void;
  updateBuffer: (id: string, buffer: ArrayBuffer) => void;
}

export interface HandlerStore {
  handlers: Record<string, FileHandler>;
  registerHandler: (handler: FileHandler) => void;
  getHandler: (ext: string) => FileHandler | undefined;
  getHandlerAsync: (ext: string, mime?: string) => Promise<FileHandler | undefined>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  files: [],
  activeFileId: null,

  openFile: (file: FileTab) => {
    const existing = get().files.find((f) => f.id === file.id);
    if (existing) {
      // If file is already open, just make it active
      set({ activeFileId: file.id });
      return;
    }
    set((state) => ({
      files: [...state.files, file],
      activeFileId: file.id,
    }));
  },

  closeFile: (id: string) => {
    set((state) => {
      const idx = state.files.findIndex((f) => f.id === id);
      if (idx === -1) return state;

      const newFiles = state.files.filter((f) => f.id !== id);
      let newActiveId = state.activeFileId;

      if (state.activeFileId === id) {
        // Pick the next file to the left, or the first available
        if (newFiles.length === 0) {
          newActiveId = null;
        } else if (idx < newFiles.length) {
          newActiveId = newFiles[idx].id;
        } else {
          newActiveId = newFiles[newFiles.length - 1].id;
        }
      }

      return { files: newFiles, activeFileId: newActiveId };
    });
  },

  setActiveFile: (id: string) => {
    set({ activeFileId: id });
  },

  updateBuffer: (id: string, buffer: ArrayBuffer) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, buffer } : f,
      ),
    }));
  },
}));

export const useHandlerStore = create<HandlerStore>((_set, _get) => ({
  handlers: {},

  registerHandler: (handler: FileHandler) => {
    globalRegistry.register(handler);
    _set((state) => ({
      handlers: { ...state.handlers, [handler.id]: handler },
    }));
  },

  getHandler: (ext: string): FileHandler | undefined => {
    // Check local store first
    return globalRegistry.resolve(ext);
  },

  getHandlerAsync: async (ext: string, mime?: string): Promise<FileHandler | undefined> => {
    const handler = await globalRegistry.resolveAsync(ext, mime);
    if (handler) {
      _set((state) => ({
        handlers: { ...state.handlers, [handler.id]: handler },
      }));
    }
    return handler;
  },
}));

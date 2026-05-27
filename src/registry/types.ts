import type { ComponentType } from 'react';

export interface FileTab {
  id: string;
  name: string;
  extension: string;
  size: number;
  lastModified: number;
  buffer: ArrayBuffer;
  text?: string;
  fileHandle?: FileSystemFileHandle;
}

export interface FileHandler {
  id: string;
  name: string;
  extensions: string[];
  mimeTypes: string[];
  canEdit: boolean;
  detect?: (buffer: ArrayBuffer) => boolean;
  Viewer: ComponentType<{
    file: FileTab;
    onSave?: (fileId: string, buffer: ArrayBuffer) => void;
  }>;
  Editor?: ComponentType<{
    file: FileTab;
    onSave: (fileId: string, buffer: ArrayBuffer) => void;
  }>;
}

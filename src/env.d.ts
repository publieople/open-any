/// <reference types="vite/client" />

// File System Access API types (Chrome 86+, Edge 86+)
interface FileSystemFileHandle {
  getFile(): Promise<File>;
  createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;
}

interface FileSystemCreateWritableOptions {
  keepExistingData?: boolean;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: ArrayBuffer | ArrayBufferView | Blob | string): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
  close(): Promise<void>;
}

interface Window {
  showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
  showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
}

interface OpenFilePickerOptions {
  multiple?: boolean;
  types?: FilePickerType[];
  excludeAcceptAllOption?: boolean;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: FilePickerType[];
  excludeAcceptAllOption?: boolean;
}

interface FilePickerType {
  description?: string;
  accept: Record<string, string[]>;
}

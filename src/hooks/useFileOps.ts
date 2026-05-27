import { useCallback, useRef } from 'react';
import { useAppStore } from '../store';
import type { FileTab } from '../registry/types';

/**
 * Read a File object as an ArrayBuffer.
 */
export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Check if the File System Access API is supported.
 */
function supportsFileSystemAccess(): boolean {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
}

/**
 * Generate a unique file ID from file metadata.
 */
function createFileId(name: string, size: number, lastModified: number): string {
  return `${name}-${size}-${lastModified}-${Date.now()}`;
}

export function useFileOps() {
  const openFile = useAppStore((s) => s.openFile);
  const updateBuffer = useAppStore((s) => s.updateBuffer);
  const files = useAppStore((s) => s.files);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Open file picker using File System Access API (fallback to <input type="file">).
   */
  const openFileFromPicker = useCallback(async (): Promise<void> => {
    try {
      let fileHandles: FileSystemFileHandle[] = [];

      if (supportsFileSystemAccess()) {
        try {
          const handles = await window.showOpenFilePicker({
            multiple: true,
          });
          fileHandles = handles as FileSystemFileHandle[];
        } catch (err: unknown) {
          // User cancelled or API failed — fall through to fallback
          if (err instanceof DOMException && err.name === 'AbortError') {
            return; // User cancelled
          }
          // Fallback to <input> below
        }
      }

      if (fileHandles.length > 0) {
        for (const handle of fileHandles) {
          const file = await handle.getFile();
          const buffer = await readFileAsArrayBuffer(file);

          const tab: FileTab = {
            id: createFileId(file.name, file.size, file.lastModified),
            name: file.name,
            extension: getExtension(file.name),
            size: file.size,
            lastModified: file.lastModified,
            buffer,
            fileHandle: handle,
          };

          openFile(tab);
        }
        return;
      }

      // Fallback: use <input type="file">
      openFileFromInputFallback();
    } catch (err: unknown) {
      console.error('Error opening file picker:', err);
      // Last resort fallback
      openFileFromInputFallback();
    }
  }, [openFile]);

  /**
   * Open files using a hidden <input type="file"> element.
   */
  const openFileFromInputFallback = useCallback((): void => {
    // Create or reuse a hidden file input
    let input = fileInputRef.current;
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.style.display = 'none';
      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    input.value = ''; // Reset so onChange fires even for the same file
    input.onchange = async () => {
      const fileList = input?.files;
      if (!fileList) return;

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        try {
          const buffer = await readFileAsArrayBuffer(file);
          const tab: FileTab = {
            id: createFileId(file.name, file.size, file.lastModified),
            name: file.name,
            extension: getExtension(file.name),
            size: file.size,
            lastModified: file.lastModified,
            buffer,
          };
          openFile(tab);
        } catch (err) {
          console.error(`Error reading file "${file.name}":`, err);
        }
      }
    };

    input.click();
  }, [openFile]);

  /**
   * Open a file from a drag-and-drop DataTransferItem.
   */
  const openFileFromDrop = useCallback(
    async (item: DataTransferItem): Promise<void> => {
      const file = item.getAsFile();
      if (!file) return;

      try {
        // Check if we can get a FileSystemFileHandle via the webkitGetAsEntry API
        const entry = item.webkitGetAsEntry?.();
        if (entry?.isDirectory) {
          // Skip directories — handled separately
          return;
        }

        const buffer = await readFileAsArrayBuffer(file);
        const tab: FileTab = {
          id: createFileId(file.name, file.size, file.lastModified),
          name: file.name,
          extension: getExtension(file.name),
          size: file.size,
          lastModified: file.lastModified,
          buffer,
        };

        // Try to get a file handle from the DataTransferItem (Chrome/Edge)
        try {
          const handle = await (item as DataTransferItem & { getAsFileSystemHandle?: () => Promise<FileSystemFileHandle> }).getAsFileSystemHandle?.();
          if (handle) {
            tab.fileHandle = handle;
          }
        } catch {
          // Not supported — proceed without handle
        }

        openFile(tab);
      } catch (err) {
        console.error('Error opening dropped file:', err);
      }
    },
    [openFile],
  );

  /**
   * Save a file. Uses File System Access API if file has a handle,
   * otherwise falls back to download.
   */
  const saveFile = useCallback(
    async (fileId: string): Promise<void> => {
      const file = files.find((f) => f.id === fileId);
      if (!file) return;

      try {
        if (file.fileHandle) {
          // File System Access API: write directly to the file
          const writable = await file.fileHandle.createWritable();
          await writable.write(file.buffer);
          await writable.close();
        } else {
          // Fallback: trigger a download
          const blob = new Blob([file.buffer]);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        console.error('Error saving file:', err);
        throw err;
      }
    },
    [files],
  );

  /**
   * Save the current buffer contents to the file.
   * Takes a text string, encodes it to an ArrayBuffer, and updates the store + saves.
   */
  const saveTextToFile = useCallback(
    async (fileId: string, text: string): Promise<void> => {
      const encoder = new TextEncoder();
      const buffer = encoder.encode(text).buffer as ArrayBuffer;
      updateBuffer(fileId, buffer);
      await saveFile(fileId);
    },
    [updateBuffer, saveFile],
  );

  return {
    openFileFromPicker,
    openFileFromDrop,
    saveFile,
    saveTextToFile,
    readFileAsArrayBuffer,
  };
}

/**
 * Extract the extension from a filename.
 */
function getExtension(name: string): string {
  const dotIndex = name.lastIndexOf('.');
  return dotIndex >= 0 ? name.slice(dotIndex + 1).toLowerCase() : '';
}

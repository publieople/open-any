import type { FileHandler } from './types';

type LazyHandler = () => Promise<{ default: FileHandler }>;

export class HandlerRegistry {
  private handlers: Map<string, FileHandler> = new Map();
  private extIndex: Map<string, string> = new Map();
  private mimeIndex: Map<string, string> = new Map();
  private lazyEntries: Array<{ id: string; extensions: string[]; mimeTypes: string[]; loader: LazyHandler }> = [];

  register(handler: FileHandler): void {
    this.handlers.set(handler.id, handler);
    for (const ext of handler.extensions) {
      this.extIndex.set(ext.toLowerCase(), handler.id);
    }
    for (const mime of handler.mimeTypes) {
      this.mimeIndex.set(mime.toLowerCase(), handler.id);
    }
  }

  registerLazy(
    id: string,
    extensions: string[],
    mimeTypes: string[],
    loader: LazyHandler,
  ): void {
    this.lazyEntries.push({ id, extensions, mimeTypes, loader });
  }

  async loadLazy(id: string): Promise<FileHandler | undefined> {
    const entry = this.lazyEntries.find((e) => e.id === id);
    if (!entry) return undefined;

    const mod = await entry.loader();
    this.register(mod.default);
    return mod.default;
  }

  resolve(extension?: string, mime?: string, _buffer?: ArrayBuffer): FileHandler | undefined {
    // Try exact extension match first
    if (extension) {
      const ext = extension.toLowerCase();
      const handlerId = this.extIndex.get(ext);
      if (handlerId) {
        const handler = this.handlers.get(handlerId);
        if (handler) return handler;
      }
    }

    // Try MIME type match
    if (mime) {
      const m = mime.toLowerCase();
      const handlerId = this.mimeIndex.get(m);
      if (handlerId) {
        const handler = this.handlers.get(handlerId);
        if (handler) return handler;
      }

      // Try partial MIME match (e.g. "text/*" handlers)
      const majorType = m.split('/')[0];
      for (const [storedMime, hId] of this.mimeIndex) {
        if (storedMime.endsWith('/*')) {
          const storedMajor = storedMime.split('/')[0];
          if (storedMajor === majorType) {
            const handler = this.handlers.get(hId);
            if (handler) return handler;
          }
        }
      }
    }

    // Try lazy resolution for extension
    if (extension) {
      const ext = extension.toLowerCase();
      for (const entry of this.lazyEntries) {
        if (entry.extensions.some((e) => e.toLowerCase() === ext)) {
          return undefined; // exists but not loaded yet
        }
      }
    }

    return undefined;
  }

  async resolveAsync(extension?: string, mime?: string, buffer?: ArrayBuffer): Promise<FileHandler | undefined> {
    const immediate = this.resolve(extension, mime, buffer);
    if (immediate) return immediate;

    // Check if lazy entry matches and try to load it
    if (extension) {
      const ext = extension.toLowerCase();
      for (const entry of this.lazyEntries) {
        if (entry.extensions.some((e) => e.toLowerCase() === ext)) {
          return this.loadLazy(entry.id);
        }
      }
    }

    if (mime) {
      const m = mime.toLowerCase();
      for (const entry of this.lazyEntries) {
        if (entry.mimeTypes.some((mt) => mt.toLowerCase() === m)) {
          return this.loadLazy(entry.id);
        }
      }
    }

    return undefined;
  }

  hasHandler(extension: string): boolean {
    const ext = extension.toLowerCase();
    if (this.extIndex.has(ext)) return true;
    return this.lazyEntries.some((e) => e.extensions.some((ex) => ex.toLowerCase() === ext));
  }

  allHandlers(): FileHandler[] {
    return Array.from(this.handlers.values());
  }

  clear(): void {
    this.handlers.clear();
    this.extIndex.clear();
    this.mimeIndex.clear();
    this.lazyEntries = [];
  }
}

export const globalRegistry = new HandlerRegistry();

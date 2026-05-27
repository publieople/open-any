export type FormatType = 'text' | 'code' | 'json' | 'yaml' | 'markdown' | 'hex' | 'unknown';

const extensionMap: Record<string, FormatType> = {
  txt: 'text',
  md: 'markdown',
  mdx: 'markdown',
  markdown: 'markdown',
  json: 'json',
  jsonc: 'json',
  geojson: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'yaml',
  ts: 'code',
  tsx: 'code',
  js: 'code',
  jsx: 'code',
  mjs: 'code',
  cjs: 'code',
  mts: 'code',
  cts: 'code',
  css: 'code',
  scss: 'code',
  less: 'code',
  html: 'code',
  htm: 'code',
  xml: 'code',
  svg: 'code',
  py: 'code',
  rb: 'code',
  rs: 'code',
  go: 'code',
  java: 'code',
  c: 'code',
  cpp: 'code',
  cc: 'code',
  h: 'code',
  hpp: 'code',
  cs: 'code',
  php: 'code',
  swift: 'code',
  kt: 'code',
  sh: 'code',
  bash: 'code',
  zsh: 'code',
  fish: 'code',
  ps1: 'code',
  bat: 'code',
  cmd: 'code',
  sql: 'code',
  graphql: 'code',
  gql: 'code',
  proto: 'code',
  r: 'code',
  dart: 'code',
  lua: 'code',
  zig: 'code',
  nim: 'code',
  cfg: 'text',
  ini: 'text',
  conf: 'text',
  env: 'text',
  log: 'text',
  csv: 'text',
  tsv: 'text',
  diff: 'text',
  patch: 'text',
};

const mimeMap: Record<string, FormatType> = {
  'text/plain': 'text',
  'text/markdown': 'markdown',
  'text/x-markdown': 'markdown',
  'text/html': 'code',
  'text/css': 'code',
  'text/javascript': 'code',
  'application/javascript': 'code',
  'application/json': 'json',
  'application/x-yaml': 'yaml',
  'application/xml': 'code',
  'text/xml': 'code',
  'application/toml': 'yaml',
  'text/csv': 'text',
  'text/tab-separated-values': 'text',
};

const binaryMagicSignatures: Array<{ pattern: number[]; offset: number }> = [
  { pattern: [0x89, 0x50, 0x4e, 0x47], offset: 0 },     // PNG
  { pattern: [0xff, 0xd8, 0xff], offset: 0 },             // JPEG
  { pattern: [0x47, 0x49, 0x46, 0x38], offset: 0 },       // GIF
  { pattern: [0x52, 0x49, 0x46, 0x46], offset: 0 },       // RIFF (WEBP, AVI, etc.)
  { pattern: [0x25, 0x50, 0x44, 0x46], offset: 0 },       // PDF
  { pattern: [0x50, 0x4b, 0x03, 0x04], offset: 0 },       // ZIP/DOCX/XLSX
  { pattern: [0x50, 0x4b, 0x05, 0x06], offset: 0 },       // ZIP (empty)
  { pattern: [0x50, 0x4b, 0x07, 0x08], offset: 0 },       // ZIP (spanned)
  { pattern: [0x1f, 0x8b], offset: 0 },                    // GZIP
  { pattern: [0x42, 0x5a, 0x68], offset: 0 },              // BZ2
  { pattern: [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00], offset: 0 }, // XZ
  { pattern: [0x4d, 0x5a], offset: 0 },                    // EXE/DLL
  { pattern: [0x7f, 0x45, 0x4c, 0x46], offset: 0 },       // ELF
  { pattern: [0x00, 0x00, 0x01, 0x00], offset: 0 },       // ICO/CUR
  { pattern: [0x66, 0x74, 0x79, 0x70], offset: 4 },       // ftyp (MP4, HEIC, etc.)
  { pattern: [0x4f, 0x67, 0x67, 0x53], offset: 0 },       // OGG
  { pattern: [0x1a, 0x45, 0xdf, 0xa3], offset: 0 },       // WebM/MKV
  { pattern: [0x49, 0x44, 0x33], offset: 0 },              // MP3 (ID3 tag)
  { pattern: [0xff, 0xfb], offset: 0 },                    // MP3 (no ID3)
  { pattern: [0xff, 0xf3], offset: 0 },                    // MP3
  { pattern: [0xff, 0xf2], offset: 0 },                    // MP3
  { pattern: [0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32], offset: 0 }, // MP4
  { pattern: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07], offset: 0 }, // RAR
  { pattern: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c], offset: 0 }, // 7z
  { pattern: [0x4d, 0x53, 0x43, 0x46], offset: 0 },       // CAB
  { pattern: [0x49, 0x49, 0x2a, 0x00], offset: 0 },       // TIFF (little-endian)
  { pattern: [0x4d, 0x4d, 0x00, 0x2a], offset: 0 },       // TIFF (big-endian)
  { pattern: [0x42, 0x4d], offset: 0 },                    // BMP
  { pattern: [0x46, 0x4f, 0x52, 0x4d], offset: 0 },       // AIFF
  { pattern: [0x77, 0x76, 0x70, 0x6b], offset: 0 },       // WVPK
];

/**
 * Detect format type from file extension.
 */
export function detectByExtension(ext: string): FormatType {
  const normalized = ext.replace(/^\./, '').toLowerCase();
  return extensionMap[normalized] ?? 'unknown';
}

/**
 * Detect format type from MIME type string.
 */
export function detectByMime(mime: string): FormatType {
  const normalized = mime.toLowerCase().trim();

  const direct = mimeMap[normalized];
  if (direct) return direct;

  // Check wildcard patterns (e.g. text/*, application/*)
  const majorType = normalized.split('/')[0];
  if (majorType === 'text') return 'text';
  if (majorType === 'image' || majorType === 'audio' || majorType === 'video') return 'hex';

  // application/* — check for known code types
  if (normalized.startsWith('application/')) {
    const subtype = normalized.split('/')[1];
    if (subtype?.endsWith('+json') || subtype?.endsWith('-json')) return 'json';
    if (subtype?.endsWith('+xml') || subtype?.endsWith('-xml')) return 'code';
  }

  return 'unknown';
}

/**
 * Detect format type from magic bytes (binary signature).
 * Returns 'unknown' if no known binary signature matches.
 * Returns 'text' if the content appears to be UTF-8 text.
 * Returns 'hex' if it's a known binary format.
 */
export function detectByMagic(buffer: ArrayBuffer): FormatType {
  const bytes = new Uint8Array(buffer);
  const len = bytes.length;

  if (len === 0) return 'text';

  // Check known binary signatures
  for (const sig of binaryMagicSignatures) {
    const start = sig.offset;
    if (start + sig.pattern.length > len) continue;
    let match = true;
    for (let i = 0; i < sig.pattern.length; i++) {
      if (bytes[start + i] !== sig.pattern[i]) {
        match = false;
        break;
      }
    }
    if (match) return 'hex';
  }

  // Check for null bytes in first 4KB — strong indicator of binary
  const checkLen = Math.min(len, 4096);
  let nullCount = 0;
  let controlCount = 0;
  for (let i = 0; i < checkLen; i++) {
    const b = bytes[i];
    if (b === 0) {
      nullCount++;
      if (nullCount > 2) return 'hex';
    }
    // Check for control characters (except tab, newline, carriage return)
    if (b < 0x20 && b !== 0x09 && b !== 0x0a && b !== 0x0d) {
      controlCount++;
      if (controlCount > 5) return 'hex';
    }
  }

  return 'text';
}

/**
 * Comprehensive format detection using extension, MIME type, and magic bytes.
 * Priority: extension > MIME > magic bytes.
 */
export function detectFormat(name: string, mime: string, buffer: ArrayBuffer): FormatType {
  // Extract extension from filename
  const dotIndex = name.lastIndexOf('.');
  const ext = dotIndex >= 0 ? name.slice(dotIndex + 1) : '';

  let result: FormatType;

  // Extension-based detection takes priority
  if (ext) {
    result = detectByExtension(ext);
    if (result !== 'unknown') return result;
  }

  // MIME-based detection
  if (mime) {
    result = detectByMime(mime);
    if (result !== 'unknown') return result;
  }

  // Magic byte detection as fallback
  return detectByMagic(buffer);
}

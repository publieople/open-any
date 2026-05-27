import { useMemo } from 'react';
import type { FileTab, FileHandler } from '../registry/types';

function formatHexByte(byte: number): string {
  return byte.toString(16).padStart(2, '0');
}

function formatAscii(byte: number): string {
  return byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '.';
}

interface HexDumpProps {
  file: FileTab;
  onSave?: (fileId: string, buffer: ArrayBuffer) => void;
}

function HexDump({ file }: HexDumpProps) {
  const rows = useMemo(() => {
    const bytes = new Uint8Array(file.buffer);
    const lines: Array<{
      offset: number;
      hex: string[];
      ascii: string[];
    }> = [];

    for (let i = 0; i < bytes.length; i += 16) {
      const chunk = bytes.slice(i, Math.min(i + 16, bytes.length));
      const hex: string[] = [];
      const ascii: string[] = [];

      for (let j = 0; j < 16; j++) {
        if (j < chunk.length) {
          hex.push(formatHexByte(chunk[j]));
          ascii.push(formatAscii(chunk[j]));
        } else {
          hex.push('  ');
          ascii.push(' ');
        }
      }

      lines.push({
        offset: i,
        hex: [
          hex.slice(0, 8).join(' '),
          hex.slice(8, 16).join(' '),
        ],
        ascii,
      });
    }

    return lines;
  }, [file.buffer]);

  const totalSize = file.buffer.byteLength;
  const sizeLabel =
    totalSize < 1024
      ? `${totalSize} B`
      : totalSize < 1024 * 1024
        ? `${(totalSize / 1024).toFixed(1)} KB`
        : `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1e1e] border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono">{file.name}</span>
        <span className="text-xs text-gray-500 font-mono">{sizeLabel}</span>
      </div>
      <div className="flex-1 overflow-auto p-0 font-mono text-xs leading-5">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#252526] text-gray-400 border-b border-gray-700">
              <th className="text-left px-3 py-1.5 w-28 font-medium select-none">
                Offset
              </th>
              <th className="text-left px-3 py-1.5 font-medium select-none">
                Hex
              </th>
              <th className="text-left px-3 py-1.5 font-medium select-none">
                ASCII
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.offset}
                className="border-b border-gray-800 hover:bg-[#2d2d2d]"
              >
                <td className="px-3 py-0 text-gray-500 select-none whitespace-nowrap">
                  {row.offset.toString(16).padStart(8, '0')}
                </td>
                <td className="px-3 py-0 text-blue-300 whitespace-nowrap font-mono">
                  <span>{row.hex[0]}</span>
                  <span className="mx-2 text-gray-600">|</span>
                  <span>{row.hex[1]}</span>
                </td>
                <td className="px-3 py-0 text-green-300 whitespace-nowrap font-mono">
                  <span>{row.ascii.slice(0, 8).join('')}</span>
                  <span className="mx-1 text-gray-600">|</span>
                  <span>{row.ascii.slice(8, 16).join('')}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            Empty file
          </div>
        )}
      </div>
    </div>
  );
}

export const handler: FileHandler = {
  id: 'hex',
  name: 'Hex Viewer',
  extensions: [],
  mimeTypes: ['application/octet-stream'],
  canEdit: false,
  Viewer: (props) => <HexDump {...props} />,
};

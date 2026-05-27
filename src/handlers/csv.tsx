import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type { FileTab, FileHandler } from '../registry/types';
import Papa from 'papaparse';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';

// ---------------------------------------------------------------------------
// CSV/TSV handler: tabular view with sort, filter, inline editing & export
// ---------------------------------------------------------------------------

interface CellEditState {
  rowIndex: number;
  colId: string;
}

interface CsvViewerProps {
  file: FileTab;
  onSave?: (fileId: string, buffer: ArrayBuffer) => void;
  readOnly?: boolean;
}

function CsvViewer({ file, onSave, readOnly = false }: CsvViewerProps) {
  // ---- Parse the CSV/TSV data ----
  const parseResult = useMemo(() => {
    const text = file.text ?? '';
    if (!text.trim()) {
      return { data: [] as Record<string, string>[], fields: [] as string[] };
    }
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      delimiter: '', // auto-detect
    });
    return {
      data: result.data as Record<string, string>[],
      fields: result.meta.fields ?? [],
    };
  }, [file.id, file.text]);

  // ---- Local mutable data for inline editing ----
  const [tableData, setTableData] = useState<Record<string, string>[]>(() =>
    parseResult.data.map((row) => ({ ...row }))
  );
  const [fields, setFields] = useState<string[]>(() => [...parseResult.fields]);

  // Sync when file changes
  useEffect(() => {
    setTableData(parseResult.data.map((row) => ({ ...row })));
    setFields([...parseResult.fields]);
  }, [parseResult.data, parseResult.fields]);

  // ---- Sorting state ----
  const [sorting, setSorting] = useState<SortingState>([]);

  // ---- Column filter (global text search) ----
  const [globalFilter, setGlobalFilter] = useState('');

  // ---- Inline editing state ----
  const [editingCell, setEditingCell] = useState<CellEditState | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // ---- Build columns from fields ----
  const columnHelper = createColumnHelper<Record<string, string>>();

  const columns = useMemo(() => {
    if (fields.length === 0) {
      // Fallback: if no headers, create a single column
      return [
        columnHelper.accessor('__raw__', {
          id: '__raw__',
          header: 'Data',
          cell: (info) => info.getValue() ?? '',
        }),
      ];
    }
    return fields.map((field) =>
      columnHelper.accessor(field, {
        id: field,
        header: field,
        cell: (info) => {
          const rowIndex = info.row.index;
          const colId = info.column.id;
          const isEditing =
            editingCell?.rowIndex === rowIndex && editingCell?.colId === colId;
          const value = info.getValue() ?? '';

          if (isEditing && !readOnly) {
            return (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => commitEdit(rowIndex, colId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitEdit(rowIndex, colId);
                  } else if (e.key === 'Escape') {
                    setEditingCell(null);
                  }
                }}
                className="w-full px-1 py-0.5 bg-[#2a2a2a] border border-blue-500 text-gray-100 text-xs outline-none rounded"
              />
            );
          }

          return (
            <span
              className="block min-h-[1.25rem] px-1 py-0.5 cursor-default"
              onDoubleClick={() => {
                if (readOnly) return;
                setEditValue(value);
                setEditingCell({ rowIndex, colId });
              }}
              title={value}
            >
              {value}
            </span>
          );
        },
      })
    );
  }, [fields, editingCell, editValue, readOnly, columnHelper]);

  // ---- Commit inline edit ----
  const commitEdit = useCallback(
    (rowIndex: number, colId: string) => {
      setTableData((prev) => {
        const updated = [...prev];
        if (updated[rowIndex]) {
          updated[rowIndex] = { ...updated[rowIndex], [colId]: editValue };
        }
        return updated;
      });
      setEditingCell(null);
    },
    [editValue]
  );

  // ---- TanStack table instance ----
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
  });

  // ---- Serialize data back to CSV ----
  const serializeToCsv = useCallback((): string => {
    const headerRow = fields.join(',');
    const dataRows = tableData.map((row) =>
      fields.map((f) => {
        const val = row[f] ?? '';
        // Escape if contains comma, quote, or newline
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    );
    return [headerRow, ...dataRows].join('\n');
  }, [fields, tableData]);

  // ---- Save handler ----
  const handleSave = useCallback(() => {
    if (!onSave) return;
    const csv = serializeToCsv();
    const encoder = new TextEncoder();
    const buffer = encoder.encode(csv).buffer;
    onSave(file.id, buffer);
  }, [onSave, serializeToCsv, file.id]);

  // ---- Export helpers ----
  const downloadBlob = useCallback((content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportCsv = useCallback(() => {
    downloadBlob(serializeToCsv(), file.name.replace(/\.(csv|tsv)$/i, '.csv'), 'text/csv');
  }, [serializeToCsv, file.name, downloadBlob]);

  const exportJson = useCallback(() => {
    const json = JSON.stringify(tableData, null, 2);
    downloadBlob(json, file.name.replace(/\.(csv|tsv)$/i, '.json'), 'application/json');
  }, [tableData, file.name, downloadBlob]);

  const exportMarkdown = useCallback(() => {
    if (fields.length === 0) return;
    // Header row
    const header = `| ${fields.join(' | ')} |`;
    const separator = `| ${fields.map(() => '---').join(' | ')} |`;
    const rows = tableData
      .map((row) => {
        const vals = fields.map((f) => row[f] ?? '').join(' | ');
        return `| ${vals} |`;
      })
      .join('\n');
    const md = `${header}\n${separator}\n${rows}\n`;
    downloadBlob(md, file.name.replace(/\.(csv|tsv)$/i, '.md'), 'text/markdown');
  }, [fields, tableData, file.name, downloadBlob]);

  // ---- Detect if data changed from original ----
  const isDirty = useMemo(() => {
    const originalJson = JSON.stringify(parseResult.data);
    const currentJson = JSON.stringify(tableData);
    return originalJson !== currentJson;
  }, [parseResult.data, tableData]);

  // ---- Compute parsed delimiter description ----
  const delimiter = useMemo(() => {
    const text = file.text ?? '';
    if (!text.trim()) return null;
    const result = Papa.parse(text, { preview: 2 });
    return result.meta.delimiter;
  }, [file.text]);

  const rowCount = table.getRowModel().rows.length;
  const totalRows = tableData.length;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1e1e] border-b border-gray-700 shrink-0 z-10 flex-wrap gap-y-1">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono">{file.name}</span>
          {delimiter && (
            <span className="text-xs text-gray-500">
              delimiter: <code className="text-gray-400">"{delimiter}"</code>
            </span>
          )}
          <span className="text-xs text-gray-500">
            {rowCount} / {totalRows} rows
            {fields.length > 0 && <> · {fields.length} columns</>}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Global search filter */}
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Filter rows..."
            className="text-xs px-2 py-1 rounded bg-[#2a2a2a] border border-gray-600 text-gray-200 placeholder-gray-500 w-36 focus:outline-none focus:border-blue-500"
          />

          {/* Export buttons */}
          <button
            onClick={exportCsv}
            className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
            title="Download as CSV"
          >
            CSV
          </button>
          <button
            onClick={exportJson}
            className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
            title="Download as JSON"
          >
            JSON
          </button>
          <button
            onClick={exportMarkdown}
            className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
            title="Download as Markdown table"
          >
            MD
          </button>

          {/* Save button */}
          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className={`text-xs px-2.5 py-1 rounded ${
                isDirty
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isDirty ? 'Save' : 'Saved'}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {fields.length === 0 && tableData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            Empty file
          </div>
        ) : (
          <table className="w-full border-collapse">
            {/* Header */}
            <thead className="sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isSorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="px-2 py-1.5 text-left text-xs font-medium text-gray-300 bg-[#252526] border-b border-r border-gray-700 cursor-pointer select-none whitespace-nowrap hover:bg-[#2d2d2e]"
                      >
                        <div className="flex items-center gap-1">
                          <span>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </span>
                          <span className="text-gray-500">
                            {isSorted === 'asc' ? ' ▲' : isSorted === 'desc' ? ' ▼' : ''}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            {/* Body */}
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-700 hover:bg-[#2a2a2a]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-2 py-0.5 text-xs text-gray-300 border-r border-gray-800 max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FileHandler export
// ---------------------------------------------------------------------------

export const handler: FileHandler = {
  id: 'csv',
  name: 'CSV/TSV Viewer',
  extensions: ['csv', 'tsv'],
  mimeTypes: ['text/csv', 'text/tab-separated-values'],
  canEdit: true,
  Viewer: (props) => <CsvViewer {...props} readOnly={true} />,
  Editor: (props) => <CsvViewer {...props} readOnly={false} />,
};

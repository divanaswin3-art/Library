import React, { useRef, useState } from 'react';
import { Download, Upload, RotateCcw, FileJson, FileSpreadsheet } from 'lucide-react';
import type { StorageInfo } from '../types/library';
import { formatBytes, formatDateTime } from '../utils/formatters';

interface StorageViewProps {
  storageInfo: StorageInfo | null;
  onImportBooks: (books: unknown[]) => Promise<{ imported: number; skipped: number }>;
  onResetCatalog: () => Promise<void>;
}

const SAMPLE_IMPORT_JSON = `[
  {
    "title": "Structure and Interpretation of Computer Programs",
    "author": "Harold Abelson, Gerald Jay Sussman",
    "isbn": "978-0262510875",
    "genre": "Computer Science",
    "publicationYear": 1996,
    "shelfLocation": "Stack A-07",
    "totalCopies": 3
  }
]`;

export function StorageView({
  storageInfo,
  onImportBooks,
  onResetCatalog,
}: StorageViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMessage(null);
    setBusy(true);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const bookArray = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.books)
        ? parsed.books
        : null;

      if (!bookArray) {
        throw new Error('JSON file must contain an array of books or a { "books": [...] } object.');
      }

      const result = await onImportBooks(bookArray);
      setStatusMessage({
        type: 'success',
        text: `Imported ${result.imported} ${result.imported === 1 ? 'book' : 'books'} into the catalog (${result.skipped} skipped).`,
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to parse JSON import file.',
      });
    } finally {
      setBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleReset() {
    setBusy(true);
    setStatusMessage(null);
    try {
      await onResetCatalog();
      setConfirmReset(false);
      setStatusMessage({
        type: 'success',
        text: 'Restored sample catalog and circulation arrays to data/library-data.json.',
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to reset library file.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div
          role="status"
          className={`rounded-md border px-4 py-3 text-sm ${
            statusMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            File Persistence &amp; Array Summary
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            All catalog books, active loans, and history entries are stored in structured arrays and written directly to disk after each borrow, return, or catalog update.
          </p>
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          <div className="px-6 py-4">
            <p className="text-xs font-medium text-slate-500">Storage File</p>
            <p className="mt-1 font-mono text-sm font-medium text-slate-900">
              {storageInfo?.filePath ?? 'data/library-data.json'}
            </p>
            <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-500">
              {storageInfo ? formatBytes(storageInfo.fileSizeBytes) : '—'}
            </p>
          </div>

          <div className="px-6 py-4">
            <p className="text-xs font-medium text-slate-500">Books Array</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900">
              {storageInfo?.bookArrayLength ?? 0}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Catalog records</p>
          </div>

          <div className="px-6 py-4">
            <p className="text-xs font-medium text-slate-500">Loans Array</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900">
              {storageInfo?.loanArrayLength ?? 0}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Active &amp; returned records</p>
          </div>

          <div className="px-6 py-4">
            <p className="text-xs font-medium text-slate-500">Last Saved</p>
            <p className="mt-1 font-mono text-sm font-medium tabular-nums text-slate-900">
              {storageInfo ? formatDateTime(storageInfo.lastSavedAt) : '—'}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
              {storageInfo?.activityArrayLength ?? 0} ledger entries
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">Export Data Files</h3>
          <p className="mt-1 text-sm text-slate-500">
            Download a full JSON snapshot (books, loans, and activity arrays) or a spreadsheet-ready CSV of your book inventory.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href="/api/library/export/json"
              download="library-data.json"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              <FileJson className="h-4 w-4 text-blue-700" />
              Export JSON Snapshot
              <Download className="h-3.5 w-3.5 text-slate-400" />
            </a>

            <a
              href="/api/library/export/csv"
              download="library-catalog.csv"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
              Export Catalog CSV
              <Download className="h-3.5 w-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">Import Books from JSON File</h3>
          <p className="mt-1 text-sm text-slate-500">
            Upload a `.json` file containing an array of book records. Duplicate ISBNs are skipped automatically.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
              id="json-import-input"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap"
            >
              <Upload className="h-4 w-4" />
              Select JSON File
            </button>

            {!confirmReset ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Sample Data
              </button>
            ) : (
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleReset}
                  className="rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 whitespace-nowrap"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmReset(false)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <pre className="mt-4 overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700">
            {SAMPLE_IMPORT_JSON}
          </pre>
        </div>
      </div>
    </div>
  );
}

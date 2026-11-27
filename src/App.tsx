import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ArrowLeftRight,
  History,
  FolderArchive,
  Plus,
  BookMarked,
  Menu,
  X,
} from 'lucide-react';
import type {
  Book,
  BookInput,
  BorrowInput,
  LibrarySnapshot,
} from './types/library';
import { CatalogView } from './components/CatalogView';
import { CirculationView } from './components/CirculationView';
import { HistoryView } from './components/HistoryView';
import { StorageView } from './components/StorageView';
import { BookModal } from './components/BookModal';
import { BorrowModal } from './components/BorrowModal';
import { ReturnModal } from './components/ReturnModal';
import { BookDetailDrawer } from './components/BookDetailDrawer';
import { getLoanDueState } from './utils/formatters';

type NavSection = 'catalog' | 'circulation' | 'history' | 'storage';

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'catalog', label: 'Book Catalog', icon: BookOpen },
  { id: 'circulation', label: 'Borrowings & Returns', icon: ArrowLeftRight },
  { id: 'history', label: 'Circulation Ledger', icon: History },
  { id: 'storage', label: 'File Storage', icon: FolderArchive },
];

export default function App() {
  const [snapshot, setSnapshot] = useState<LibrarySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState<NavSection>('catalog');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [borrowInitialBook, setBorrowInitialBook] = useState<Book | null>(null);
  const [returnTargetBookId, setReturnTargetBookId] = useState<string | null>(null);
  const [drawerBookId, setDrawerBookId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch('/api/library');
      if (!response.ok) {
        throw new Error('Failed to load library catalog from server.');
      }
      const data = (await response.json()) as LibrarySnapshot;
      setSnapshot(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to connect to library server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const books = snapshot?.books ?? [];
  const loans = snapshot?.loans ?? [];
  const activities = snapshot?.activities ?? [];
  const storageInfo = snapshot?.storageInfo ?? null;

  const drawerBook = useMemo(
    () => books.find((b) => b.id === drawerBookId) ?? null,
    [books, drawerBookId]
  );

  const returnTargetBook = useMemo(
    () => books.find((b) => b.id === returnTargetBookId) ?? null,
    [books, returnTargetBookId]
  );

  const returnTargetLoans = useMemo(
    () =>
      loans.filter((l) => l.bookId === returnTargetBookId && l.status === 'Active'),
    [loans, returnTargetBookId]
  );

  const activeLoanCount = useMemo(
    () => loans.filter((l) => l.status === 'Active').length,
    [loans]
  );

  const overdueCount = useMemo(
    () =>
      loans.filter(
        (l) => l.status === 'Active' && getLoanDueState(l).label === 'Overdue'
      ).length,
    [loans]
  );

  async function apiMutate<T = LibrarySnapshot>(
    url: string,
    method: 'POST' | 'PUT' | 'DELETE',
    body?: unknown
  ): Promise<T> {
    const response = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || 'Request failed.');
    }
    return payload as T;
  }

  async function handleSaveBook(input: BookInput, bookId?: string) {
    const updated = bookId
      ? await apiMutate<LibrarySnapshot>(`/api/books/${bookId}`, 'PUT', input)
      : await apiMutate<LibrarySnapshot>('/api/books', 'POST', input);
    setSnapshot(updated);
    showToast(
      'success',
      bookId ? `Updated "${input.title}".` : `Added "${input.title}" to catalog.`
    );
  }

  async function handleDeleteBook(book: Book) {
    try {
      const updated = await apiMutate<LibrarySnapshot>(`/api/books/${book.id}`, 'DELETE');
      setSnapshot(updated);
      setDrawerBookId(null);
      showToast('success', `Removed "${book.title}" from catalog.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Unable to delete book.');
    }
  }

  async function handleBorrowBook(input: BorrowInput) {
    const updated = await apiMutate<LibrarySnapshot>('/api/loans/borrow', 'POST', input);
    setSnapshot(updated);
    const title = books.find((b) => b.id === input.bookId)?.title || 'Book';
    showToast('success', `Checked out "${title}" to ${input.borrowerName}.`);
  }

  async function handleReturnLoan(loanId: string) {
    try {
      const updated = await apiMutate<LibrarySnapshot>(`/api/loans/${loanId}/return`, 'POST');
      setSnapshot(updated);
      showToast('success', 'Book returned and shelf availability updated.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Unable to return book.');
      throw err;
    }
  }

  async function handleExtendLoan(loanId: string, days: number) {
    try {
      const updated = await apiMutate<LibrarySnapshot>(`/api/loans/${loanId}/extend`, 'POST', {
        days,
      });
      setSnapshot(updated);
      showToast('success', `Extended due date by ${days} days.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Unable to extend loan.');
    }
  }

  async function handleImportBooks(incomingBooks: unknown[]) {
    const result = await apiMutate<{
      snapshot: LibrarySnapshot;
      imported: number;
      skipped: number;
    }>('/api/library/import', 'POST', { books: incomingBooks });
    setSnapshot(result.snapshot);
    showToast('success', `Imported ${result.imported} books into catalog.`);
    return { imported: result.imported, skipped: result.skipped };
  }

  async function handleResetCatalog() {
    const updated = await apiMutate<LibrarySnapshot>('/api/library/reset', 'POST');
    setSnapshot(updated);
    setDrawerBookId(null);
    showToast('success', 'Restored sample catalog and loans.');
  }

  const currentNavLabel = NAV_ITEMS.find((item) => item.id === activeNav)?.label ?? 'Book Catalog';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <aside className="hidden border-r border-slate-200 bg-white md:flex md:w-64 md:shrink-0 md:flex-col">
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-6">
          <BookMarked className="h-5 w-5 text-blue-700 shrink-0" />
          <span className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Folio Library
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Library workspace">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5 whitespace-nowrap">
                  <Icon className={`h-4 w-4 ${active ? 'text-blue-700' : 'text-slate-400'}`} />
                  {item.label}
                </span>
                {item.id === 'circulation' && activeLoanCount > 0 && (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      overdueCount > 0 ? 'font-semibold text-red-700' : 'text-slate-500'
                    }`}
                  >
                    {activeLoanCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
          <p className="font-medium text-slate-700">Desk Storage</p>
          <p className="mt-0.5 font-mono truncate">
            {storageInfo?.filePath ?? 'data/library-data.json'}
          </p>
          <p className="mt-1 tabular-nums">
            {books.length} titles · {activeLoanCount} active loans
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden font-medium text-slate-500 sm:inline whitespace-nowrap">
                Folio Library
              </span>
              <span className="hidden text-slate-300 sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="truncate font-display text-base font-semibold text-slate-900">
                {currentNavLabel}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setBorrowInitialBook(null);
                setBorrowModalOpen(true);
              }}
              className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              Checkout Book
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingBook(null);
                setBookModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Book
            </button>
          </div>
        </header>

        {mobileMenuOpen && (
          <nav
            className="border-b border-slate-200 bg-white px-4 py-2 md:hidden"
            aria-label="Mobile workspace navigation"
          >
            <div className="flex flex-wrap gap-1.5">
              {NAV_ITEMS.map((item) => {
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveNav(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                      active
                        ? 'bg-blue-50 text-blue-800'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {toast && (
            <div
              role="status"
              className={`mb-5 flex items-center justify-between rounded-md border px-4 py-2.5 text-sm ${
                toast.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              <span>{toast.text}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="ml-4 text-xs font-medium opacity-70 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

          {loadError ? (
            <div className="rounded-lg border border-red-200 bg-white p-8 text-center">
              <p className="text-sm font-semibold text-red-700">{loadError}</p>
              <button
                type="button"
                onClick={fetchLibrary}
                className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <>
              {activeNav === 'catalog' && (
                <CatalogView
                  books={books}
                  loans={loans}
                  loading={loading}
                  onSelectBook={(book) => setDrawerBookId(book.id)}
                  onBorrowBook={(book) => {
                    setBorrowInitialBook(book);
                    setBorrowModalOpen(true);
                  }}
                  onReturnBook={(book) => setReturnTargetBookId(book.id)}
                  onAddBook={() => {
                    setEditingBook(null);
                    setBookModalOpen(true);
                  }}
                />
              )}

              {activeNav === 'circulation' && (
                <CirculationView
                  loans={loans}
                  onReturnLoan={handleReturnLoan}
                  onExtendLoan={handleExtendLoan}
                  onOpenBorrowModal={() => {
                    setBorrowInitialBook(null);
                    setBorrowModalOpen(true);
                  }}
                />
              )}

              {activeNav === 'history' && (
                <HistoryView activities={activities} loans={loans} />
              )}

              {activeNav === 'storage' && (
                <StorageView
                  storageInfo={storageInfo}
                  onImportBooks={handleImportBooks}
                  onResetCatalog={handleResetCatalog}
                />
              )}
            </>
          )}
        </main>
      </div>

      <BookModal
        isOpen={bookModalOpen}
        editingBook={editingBook}
        onClose={() => {
          setBookModalOpen(false);
          setEditingBook(null);
        }}
        onSubmit={handleSaveBook}
      />

      <BorrowModal
        isOpen={borrowModalOpen}
        books={books}
        initialBook={borrowInitialBook}
        onClose={() => {
          setBorrowModalOpen(false);
          setBorrowInitialBook(null);
        }}
        onBorrow={handleBorrowBook}
      />

      <ReturnModal
        book={returnTargetBook}
        activeLoans={returnTargetLoans}
        onClose={() => setReturnTargetBookId(null)}
        onReturnLoan={handleReturnLoan}
      />

      <BookDetailDrawer
        book={drawerBook}
        loans={loans}
        onClose={() => setDrawerBookId(null)}
        onBorrow={(book) => {
          setBorrowInitialBook(book);
          setBorrowModalOpen(true);
        }}
        onReturnLoan={handleReturnLoan}
        onEdit={(book) => {
          setEditingBook(book);
          setBookModalOpen(true);
        }}
        onDelete={handleDeleteBook}
      />
    </div>
  );
}

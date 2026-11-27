import React, { useEffect } from 'react';
import { X, Pencil, Trash2, ArrowUpRight, RotateCcw } from 'lucide-react';
import type { Book, LoanRecord } from '../types/library';
import { formatShortDate, getBookAvailability, getLoanDueState } from '../utils/formatters';

interface BookDetailDrawerProps {
  book: Book | null;
  loans: LoanRecord[];
  onClose: () => void;
  onBorrow: (book: Book) => void;
  onReturnLoan: (loanId: string) => Promise<void>;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => Promise<void>;
}

export function BookDetailDrawer({
  book,
  loans,
  onClose,
  onBorrow,
  onReturnLoan,
  onEdit,
  onDelete,
}: BookDetailDrawerProps) {
  useEffect(() => {
    if (!book) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [book, onClose]);

  if (!book) return null;

  const availability = getBookAvailability(book);
  const activeLoans = loans.filter((l) => l.bookId === book.id && l.status === 'Active');
  const pastLoans = loans.filter((l) => l.bookId === book.id && l.status === 'Returned');

  const statusTone =
    availability === 'Available'
      ? 'text-emerald-700'
      : availability === 'Low Stock'
      ? 'text-amber-700'
      : 'text-red-700';

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30 backdrop-blur-[1px]">
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-book-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <p className="font-mono text-xs text-slate-500">
              {book.callNumber} · {book.shelfLocation}
            </p>
            <h2 id="drawer-book-title" className="mt-1 text-lg font-semibold leading-snug text-slate-900">
              {book.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{book.author}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-5">
            <div>
              <p className="text-xs text-slate-500">Availability</p>
              <p className={`mt-1 text-sm font-semibold ${statusTone}`}>{availability}</p>
              <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-600">
                {book.availableCopies} of {book.totalCopies} copies on shelf
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Catalog Metadata</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {book.genre} · {book.publicationYear}
              </p>
              <p className="mt-0.5 font-mono text-xs text-slate-500">ISBN {book.isbn}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={book.availableCopies <= 0}
              onClick={() => onBorrow(book)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 whitespace-nowrap"
            >
              <ArrowUpRight className="h-4 w-4" />
              Checkout Copy
            </button>
            <button
              type="button"
              onClick={() => onEdit(book)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              disabled={activeLoans.length > 0}
              title={
                activeLoans.length > 0
                  ? 'Return all active copies before deleting'
                  : 'Remove book from catalog'
              }
              onClick={() => onDelete(book)}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Delete book"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Active Borrowers ({activeLoans.length})
            </h3>
            {activeLoans.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No copies are currently checked out.</p>
            ) : (
              <div className="mt-2.5 divide-y divide-slate-200 rounded-md border border-slate-200">
                {activeLoans.map((loan) => {
                  const due = getLoanDueState(loan);
                  const dueTone =
                    due.label === 'Overdue'
                      ? 'text-red-700'
                      : due.label === 'Due Soon'
                      ? 'text-amber-700'
                      : 'text-emerald-700';
                  return (
                    <div key={loan.id} className="flex items-center justify-between gap-3 px-3.5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {loan.borrowerName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                          {loan.memberId} · Due {formatShortDate(loan.dueDate)} ·{' '}
                          <span className={`font-medium ${dueTone}`}>{due.label}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onReturnLoan(loan.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Return
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {pastLoans.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Recent Returns ({pastLoans.length})
              </h3>
              <div className="mt-2.5 divide-y divide-slate-100 border-t border-slate-200">
                {pastLoans.slice(0, 6).map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div>
                      <span className="font-medium text-slate-800">{loan.borrowerName}</span>
                      <span className="ml-1.5 font-mono text-slate-400">{loan.memberId}</span>
                    </div>
                    <span className="text-slate-500 tabular-nums">
                      Returned {loan.returnedAt ? formatShortDate(loan.returnedAt) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

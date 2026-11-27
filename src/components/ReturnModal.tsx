import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Book, LoanRecord } from '../types/library';
import { formatShortDate, getLoanDueState } from '../utils/formatters';

interface ReturnModalProps {
  book: Book | null;
  activeLoans: LoanRecord[];
  onClose: () => void;
  onReturnLoan: (loanId: string) => Promise<void>;
}

export function ReturnModal({ book, activeLoans, onClose, onReturnLoan }: ReturnModalProps) {
  const [returningId, setReturningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setReturningId(null);
  }, [book]);

  useEffect(() => {
    if (!book) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [book, onClose]);

  if (!book) return null;

  async function handleReturn(loanId: string) {
    setError(null);
    setReturningId(loanId);
    try {
      await onReturnLoan(loanId);
      if (activeLoans.length <= 1) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process return.');
    } finally {
      setReturningId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-modal-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="return-modal-title" className="text-base font-semibold text-slate-900">
              Return Borrowed Copy
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {book.title} · {book.callNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {activeLoans.length === 0 ? (
            <p className="text-sm text-slate-600">All copies of this book are currently on the shelf.</p>
          ) : (
            <div className="divide-y divide-slate-200 rounded-md border border-slate-200">
              {activeLoans.map((loan) => {
                const dueState = getLoanDueState(loan);
                const statusColor =
                  dueState.label === 'Overdue'
                    ? 'text-red-700'
                    : dueState.label === 'Due Soon'
                    ? 'text-amber-700'
                    : 'text-emerald-700';

                return (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-slate-900">
                          {loan.borrowerName}
                        </span>
                        <span className="font-mono text-xs text-slate-500">{loan.memberId}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                        Borrowed {formatShortDate(loan.borrowedAt)} · Due {formatShortDate(loan.dueDate)} ·{' '}
                        <span className={`font-medium ${statusColor}`}>
                          {dueState.label}
                          {dueState.label === 'Overdue' ? ` (${dueState.daysDelta}d)` : ''}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={returningId === loan.id}
                      onClick={() => handleReturn(loan.id)}
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      {returningId === loan.id ? 'Returning...' : 'Mark Returned'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

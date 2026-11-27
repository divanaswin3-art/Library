import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Book, BorrowInput } from '../types/library';

interface BorrowModalProps {
  isOpen: boolean;
  books: Book[];
  initialBook: Book | null;
  onClose: () => void;
  onBorrow: (input: BorrowInput) => Promise<void>;
}

const DURATION_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '14 Days (Standard)', value: 14 },
  { label: '21 Days', value: 21 },
  { label: '30 Days', value: 30 },
];

export function BorrowModal({
  isOpen,
  books,
  initialBook,
  onClose,
  onBorrow,
}: BorrowModalProps) {
  const availableBooks = books.filter((b) => b.availableCopies > 0);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [loanDays, setLoanDays] = useState(14);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setBorrowerName('');
    setMemberId('');
    setLoanDays(14);
    setNotes('');
    if (initialBook && initialBook.availableCopies > 0) {
      setSelectedBookId(initialBook.id);
    } else if (availableBooks.length > 0) {
      setSelectedBookId(availableBooks[0].id);
    } else {
      setSelectedBookId('');
    }
  }, [isOpen, initialBook]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedBook = books.find((b) => b.id === selectedBookId) || null;
  const previewDueDate = new Date(Date.now() + loanDays * 86400000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedBookId) {
      setError('Select an available book to borrow.');
      return;
    }
    if (!borrowerName.trim() || !memberId.trim()) {
      setError('Borrower name and member ID are required.');
      return;
    }

    setSubmitting(true);
    try {
      await onBorrow({
        bookId: selectedBookId,
        borrowerName: borrowerName.trim(),
        memberId: memberId.trim(),
        loanDays,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record checkout.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="borrow-modal-title"
    >
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="borrow-modal-title" className="text-base font-semibold text-slate-900">
            Checkout Book
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {availableBooks.length === 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Every copy in the catalog is currently checked out. Return a borrowed book before creating a new checkout.
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="borrow-book" className="mb-1.5 block text-xs font-medium text-slate-700">
                  Book Title
                </label>
                <select
                  id="borrow-book"
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                >
                  {availableBooks.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} ({book.availableCopies}/{book.totalCopies} available)
                    </option>
                  ))}
                </select>
                {selectedBook && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    {selectedBook.author} · {selectedBook.callNumber} · {selectedBook.shelfLocation}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="borrower-name" className="mb-1.5 block text-xs font-medium text-slate-700">
                    Borrower Name
                  </label>
                  <input
                    id="borrower-name"
                    type="text"
                    required
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    placeholder="e.g., Maya Patel"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                  />
                </div>

                <div>
                  <label htmlFor="member-id" className="mb-1.5 block text-xs font-medium text-slate-700">
                    Member ID
                  </label>
                  <input
                    id="member-id"
                    type="text"
                    required
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    placeholder="e.g., MEM-5420"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="loan-days" className="mb-1.5 block text-xs font-medium text-slate-700">
                  Loan Period
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLoanDays(opt.value)}
                      className={`rounded-md border px-2.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        loanDays === opt.value
                          ? 'border-blue-700 bg-blue-50 text-blue-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {opt.value} Days
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
                  Due back on {previewDueDate}
                </p>
              </div>

              <div>
                <label htmlFor="loan-notes" className="mb-1.5 block text-xs font-medium text-slate-700">
                  Desk Notes <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  id="loan-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Condition check or course reserve note"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            {availableBooks.length > 0 && (
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {submitting ? 'Checking out...' : 'Confirm Checkout'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

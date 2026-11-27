import React, { useMemo, useState } from 'react';
import { Search, ArrowUpDown, Plus } from 'lucide-react';
import type { AvailabilityStatus, Book, LoanRecord } from '../types/library';
import { getBookAvailability, getLoanDueState } from '../utils/formatters';

interface CatalogViewProps {
  books: Book[];
  loans: LoanRecord[];
  loading: boolean;
  onSelectBook: (book: Book) => void;
  onBorrowBook: (book: Book) => void;
  onReturnBook: (book: Book) => void;
  onAddBook: () => void;
}

type StatusFilter = 'All' | AvailabilityStatus;
type SortKey = 'title' | 'author' | 'availableCopies' | 'publicationYear';

export function CatalogView({
  books,
  loans,
  loading,
  onSelectBook,
  onBorrowBook,
  onReturnBook,
  onAddBook,
}: CatalogViewProps) {
  const [query, setQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortAsc, setSortAsc] = useState(true);

  const genres = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => set.add(b.genre));
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [books]);

  const metrics = useMemo(() => {
    const totalTitles = books.length;
    const totalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
    const availableCopies = books.reduce((sum, b) => sum + b.availableCopies, 0);
    const borrowedCopies = totalCopies - availableCopies;
    const overdueCount = loans.filter(
      (l) => l.status === 'Active' && getLoanDueState(l).label === 'Overdue'
    ).length;

    return {
      totalTitles,
      totalCopies,
      availableCopies,
      borrowedCopies,
      overdueCount,
    };
  }, [books, loans]);

  const filteredBooks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = books.filter((book) => {
      if (genreFilter !== 'All' && book.genre !== genreFilter) return false;
      const status = getBookAvailability(book);
      if (statusFilter !== 'All' && status !== statusFilter) return false;
      if (!needle) return true;
      return (
        book.title.toLowerCase().includes(needle) ||
        book.author.toLowerCase().includes(needle) ||
        book.isbn.toLowerCase().includes(needle) ||
        book.callNumber.toLowerCase().includes(needle) ||
        book.shelfLocation.toLowerCase().includes(needle)
      );
    });

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortKey === 'author') cmp = a.author.localeCompare(b.author);
      else if (sortKey === 'availableCopies') cmp = a.availableCopies - b.availableCopies;
      else if (sortKey === 'publicationYear') cmp = a.publicationYear - b.publicationYear;
      return sortAsc ? cmp : -cmp;
    });
  }, [books, query, genreFilter, statusFilter, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Catalog Titles</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-slate-900">
            {metrics.totalTitles}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
            {metrics.totalCopies} total volumes
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Available on Shelf</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-emerald-700">
            {metrics.availableCopies}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
            Ready for checkout
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Currently Borrowed</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-slate-900">
            {metrics.borrowedCopies}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
            Active member loans
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Overdue Loans</p>
          <p
            className={`mt-1 font-display text-2xl font-semibold tabular-nums ${
              metrics.overdueCount > 0 ? 'text-red-700' : 'text-slate-900'
            }`}
          >
            {metrics.overdueCount}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {metrics.overdueCount > 0 ? 'Requires follow-up' : 'All loans on schedule'}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, author, ISBN, or call number..."
                aria-label="Search catalog"
                className="w-full rounded-md border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
              />
            </div>

            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              aria-label="Filter by subject"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
            >
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g === 'All' ? 'All Subjects' : g}
                </option>
              ))}
            </select>
          </div>

          <div
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 p-1 self-start lg:self-auto"
            role="group"
            aria-label="Availability filter"
          >
            {(['All', 'Available', 'Low Stock', 'Checked Out'] as StatusFilter[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="space-y-1.5">
                  <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
                </div>
                <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-900">Your library catalog is empty</p>
            <p className="mt-1 text-sm text-slate-500">
              Add your first book record to begin tracking shelf availability and loans.
            </p>
            <button
              type="button"
              onClick={onAddBook}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add First Book
            </button>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-900">No matching books found</p>
            <p className="mt-1 text-sm text-slate-500">
              Adjust your search query, subject, or availability filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setGenreFilter('All');
                setStatusFilter('All');
              }}
              className="mt-3 rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-2.5 pr-3 pl-5">
                    <button
                      type="button"
                      onClick={() => handleSort('title')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      Book Title &amp; Details
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="hidden px-3 py-2.5 md:table-cell">
                    <button
                      type="button"
                      onClick={() => handleSort('author')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      Author
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="hidden px-3 py-2.5 lg:table-cell">Shelf / Call No.</th>
                  <th className="px-3 py-2.5">Availability</th>
                  <th className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('availableCopies')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      Copies
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-2.5 pr-5 pl-3 text-right">Circulation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBooks.map((book) => {
                  const status = getBookAvailability(book);
                  const borrowedCount = book.totalCopies - book.availableCopies;
                  const statusClass =
                    status === 'Available'
                      ? 'text-emerald-700'
                      : status === 'Low Stock'
                      ? 'text-amber-700'
                      : 'text-red-700';

                  return (
                    <tr
                      key={book.id}
                      className="group transition-colors hover:bg-slate-50/80"
                    >
                      <td className="py-3 pr-3 pl-5">
                        <button
                          type="button"
                          onClick={() => onSelectBook(book)}
                          className="text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                        >
                          <div className="font-medium text-slate-900 group-hover:text-blue-700">
                            {book.title}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500 tabular-nums">
                            {book.genre} · {book.publicationYear} ·{' '}
                            <span className="font-mono">{book.isbn}</span>
                          </div>
                        </button>
                      </td>

                      <td className="hidden px-3 py-3 text-slate-700 md:table-cell">
                        <div className="max-w-[220px] truncate">{book.author}</div>
                      </td>

                      <td className="hidden px-3 py-3 lg:table-cell">
                        <div className="text-xs font-medium text-slate-800">
                          {book.shelfLocation}
                        </div>
                        <div className="font-mono text-xs text-slate-500">
                          {book.callNumber}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <span className={`text-xs font-semibold whitespace-nowrap ${statusClass}`}>
                          {status}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-slate-800">
                        <span className="font-semibold">{book.availableCopies}</span>
                        <span className="text-slate-400"> / {book.totalCopies}</span>
                      </td>

                      <td className="py-3 pr-5 pl-3 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={book.availableCopies <= 0}
                            onClick={() => onBorrowBook(book)}
                            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 transition-colors hover:border-blue-700 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap shrink-0"
                          >
                            Borrow
                          </button>
                          {borrowedCount > 0 && (
                            <button
                              type="button"
                              onClick={() => onReturnBook(book)}
                              className="rounded border border-slate-300 bg-slate-900 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
                            >
                              Return
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { Search, Plus, RotateCcw, CalendarPlus } from 'lucide-react';
import type { LoanRecord } from '../types/library';
import { formatShortDate, getLoanDueState } from '../utils/formatters';

interface CirculationViewProps {
  loans: LoanRecord[];
  onReturnLoan: (loanId: string) => Promise<void>;
  onExtendLoan: (loanId: string, days: number) => Promise<void>;
  onOpenBorrowModal: () => void;
}

type LoanFilter = 'All Active' | 'Overdue' | 'Due Soon' | 'On Time';

export function CirculationView({
  loans,
  onReturnLoan,
  onExtendLoan,
  onOpenBorrowModal,
}: CirculationViewProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LoanFilter>('All Active');
  const [busyLoanId, setBusyLoanId] = useState<string | null>(null);

  const activeLoans = useMemo(() => {
    return loans
      .filter((l) => l.status === 'Active')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [loans]);

  const counts = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let onTime = 0;
    for (const loan of activeLoans) {
      const state = getLoanDueState(loan);
      if (state.label === 'Overdue') overdue += 1;
      else if (state.label === 'Due Soon') dueSoon += 1;
      else onTime += 1;
    }
    return { total: activeLoans.length, overdue, dueSoon, onTime };
  }, [activeLoans]);

  const filteredLoans = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return activeLoans.filter((loan) => {
      const dueState = getLoanDueState(loan);
      if (filter !== 'All Active' && dueState.label !== filter) return false;
      if (!needle) return true;
      return (
        loan.borrowerName.toLowerCase().includes(needle) ||
        loan.memberId.toLowerCase().includes(needle) ||
        loan.bookTitle.toLowerCase().includes(needle) ||
        loan.callNumber.toLowerCase().includes(needle)
      );
    });
  }, [activeLoans, filter, query]);

  async function handleReturn(loanId: string) {
    setBusyLoanId(loanId);
    try {
      await onReturnLoan(loanId);
    } finally {
      setBusyLoanId(null);
    }
  }

  async function handleExtend(loanId: string) {
    setBusyLoanId(loanId);
    try {
      await onExtendLoan(loanId, 7);
    } finally {
      setBusyLoanId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Active Loans</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-slate-900">
            {counts.total}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Overdue</p>
          <p
            className={`mt-1 font-display text-2xl font-semibold tabular-nums ${
              counts.overdue > 0 ? 'text-red-700' : 'text-slate-900'
            }`}
          >
            {counts.overdue}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Due Within 3 Days</p>
          <p
            className={`mt-1 font-display text-2xl font-semibold tabular-nums ${
              counts.dueSoon > 0 ? 'text-amber-700' : 'text-slate-900'
            }`}
          >
            {counts.dueSoon}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500">On Time</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-emerald-700">
            {counts.onTime}
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
                placeholder="Search borrower, member ID, or book title..."
                aria-label="Search active borrowings"
                className="w-full rounded-md border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
              />
            </div>

            <div
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 p-1 self-start"
              role="group"
              aria-label="Loan status filter"
            >
              {(['All Active', 'Overdue', 'Due Soon', 'On Time'] as LoanFilter[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    filter === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenBorrowModal}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0 self-start lg:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            New Checkout
          </button>
        </div>

        {activeLoans.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-900">No active borrowings</p>
            <p className="mt-1 text-sm text-slate-500">
              All catalog copies are currently returned and available on shelf.
            </p>
            <button
              type="button"
              onClick={onOpenBorrowModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Checkout a Book
            </button>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-900">No loans match your filter</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFilter('All Active');
              }}
              className="mt-3 rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-2.5 pr-3 pl-5">Borrower</th>
                  <th className="px-3 py-2.5">Book Title</th>
                  <th className="hidden px-3 py-2.5 md:table-cell">Checked Out</th>
                  <th className="px-3 py-2.5">Due Date</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="py-2.5 pr-5 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLoans.map((loan) => {
                  const dueState = getLoanDueState(loan);
                  const statusTone =
                    dueState.label === 'Overdue'
                      ? 'text-red-700'
                      : dueState.label === 'Due Soon'
                      ? 'text-amber-700'
                      : 'text-emerald-700';
                  const isBusy = busyLoanId === loan.id;

                  return (
                    <tr key={loan.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="py-3 pr-3 pl-5">
                        <div className="font-medium text-slate-900">{loan.borrowerName}</div>
                        <div className="font-mono text-xs text-slate-500">{loan.memberId}</div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="max-w-xs truncate font-medium text-slate-800">
                          {loan.bookTitle}
                        </div>
                        <div className="font-mono text-xs text-slate-500">
                          {loan.callNumber}
                          {loan.notes ? ` · ${loan.notes}` : ''}
                        </div>
                      </td>

                      <td className="hidden px-3 py-3 text-xs tabular-nums text-slate-600 md:table-cell">
                        {formatShortDate(loan.borrowedAt)}
                      </td>

                      <td className="px-3 py-3 text-xs font-medium tabular-nums text-slate-800">
                        {formatShortDate(loan.dueDate)}
                      </td>

                      <td className="px-3 py-3">
                        <span className={`text-xs font-semibold whitespace-nowrap ${statusTone}`}>
                          {dueState.label}
                          {dueState.label === 'Overdue' ? ` (${dueState.daysDelta}d)` : ''}
                          {dueState.label === 'Due Soon'
                            ? dueState.daysDelta === 0
                              ? ' (Today)'
                              : ` (${dueState.daysDelta}d)`
                            : ''}
                        </span>
                      </td>

                      <td className="py-3 pr-5 pl-3 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleExtend(loan.id)}
                            title="Extend due date by 7 days"
                            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0"
                          >
                            <CalendarPlus className="h-3.5 w-3.5" />
                            +7d
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleReturn(loan.id)}
                            className="inline-flex items-center gap-1 rounded bg-slate-900 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap shrink-0"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Return
                          </button>
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

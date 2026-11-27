import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { ActivityEntry, ActivityType, LoanRecord } from '../types/library';
import { formatDateTime, formatShortDate } from '../utils/formatters';

interface HistoryViewProps {
  activities: ActivityEntry[];
  loans: LoanRecord[];
}

type HistoryTab = 'ledger' | 'returned';

const TYPE_LABELS: Record<ActivityType, string> = {
  BORROW: 'Borrowed',
  RETURN: 'Returned',
  ADD_BOOK: 'Book Added',
  UPDATE_BOOK: 'Updated',
  DELETE_BOOK: 'Removed',
  EXTEND_LOAN: 'Extended',
  IMPORT: 'Imported',
};

export function HistoryView({ activities, loans }: HistoryViewProps) {
  const [tab, setTab] = useState<HistoryTab>('ledger');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | ActivityType>('ALL');

  const returnedLoans = useMemo(
    () =>
      loans
        .filter((l) => l.status === 'Returned')
        .sort(
          (a, b) =>
            new Date(b.returnedAt || b.borrowedAt).getTime() -
            new Date(a.returnedAt || a.borrowedAt).getTime()
        ),
    [loans]
  );

  const filteredActivities = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return activities.filter((entry) => {
      if (typeFilter !== 'ALL' && entry.type !== typeFilter) return false;
      if (!needle) return true;
      return (
        entry.bookTitle.toLowerCase().includes(needle) ||
        entry.actor.toLowerCase().includes(needle) ||
        entry.detail.toLowerCase().includes(needle)
      );
    });
  }, [activities, typeFilter, query]);

  const filteredReturned = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return returnedLoans.filter((loan) => {
      if (!needle) return true;
      return (
        loan.bookTitle.toLowerCase().includes(needle) ||
        loan.borrowerName.toLowerCase().includes(needle) ||
        loan.memberId.toLowerCase().includes(needle)
      );
    });
  }, [returnedLoans, query]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 p-1 self-start"
            role="group"
            aria-label="History view mode"
          >
            <button
              type="button"
              onClick={() => setTab('ledger')}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                tab === 'ledger'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Activity Ledger ({activities.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('returned')}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                tab === 'returned'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed Returns ({returnedLoans.length})
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter history..."
              aria-label="Filter circulation history"
              className="w-full rounded-md border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
            />
          </div>
        </div>

        {tab === 'ledger' && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'ALL' | ActivityType)}
            aria-label="Filter by event type"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15 self-start lg:self-auto"
          >
            <option value="ALL">All Events</option>
            <option value="BORROW">Borrowed</option>
            <option value="RETURN">Returned</option>
            <option value="EXTEND_LOAN">Extended</option>
            <option value="ADD_BOOK">Book Added</option>
            <option value="UPDATE_BOOK">Updated</option>
            <option value="DELETE_BOOK">Removed</option>
            <option value="IMPORT">Imported</option>
          </select>
        )}
      </div>

      {tab === 'ledger' ? (
        filteredActivities.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            No matching ledger records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-2.5 pr-3 pl-5">Event</th>
                  <th className="px-3 py-2.5">Book Title</th>
                  <th className="px-3 py-2.5">Member / Desk</th>
                  <th className="hidden px-3 py-2.5 md:table-cell">Detail</th>
                  <th className="py-2.5 pr-5 pl-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredActivities.map((entry) => {
                  const tone =
                    entry.type === 'RETURN'
                      ? 'text-emerald-700'
                      : entry.type === 'BORROW'
                      ? 'text-blue-700'
                      : entry.type === 'DELETE_BOOK'
                      ? 'text-red-700'
                      : 'text-slate-700';
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80">
                      <td className="py-3 pr-3 pl-5">
                        <span className={`text-xs font-semibold whitespace-nowrap ${tone}`}>
                          {TYPE_LABELS[entry.type]}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        <div className="max-w-xs truncate">{entry.bookTitle}</div>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-700">{entry.actor}</td>
                      <td className="hidden px-3 py-3 text-xs text-slate-500 md:table-cell">
                        {entry.detail}
                      </td>
                      <td className="py-3 pr-5 pl-3 text-right font-mono text-xs tabular-nums text-slate-500 whitespace-nowrap">
                        {formatDateTime(entry.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : filteredReturned.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-slate-500">
          No completed returns match your search.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-2.5 pr-3 pl-5">Book Title</th>
                <th className="px-3 py-2.5">Borrower</th>
                <th className="px-3 py-2.5">Borrowed</th>
                <th className="px-3 py-2.5">Due Date</th>
                <th className="py-2.5 pr-5 pl-3 text-right">Returned On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReturned.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-50/80">
                  <td className="py-3 pr-3 pl-5">
                    <div className="font-medium text-slate-900">{loan.bookTitle}</div>
                    <div className="font-mono text-xs text-slate-500">{loan.callNumber}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-slate-800">{loan.borrowerName}</div>
                    <div className="font-mono text-xs text-slate-500">{loan.memberId}</div>
                  </td>
                  <td className="px-3 py-3 text-xs tabular-nums text-slate-600">
                    {formatShortDate(loan.borrowedAt)}
                  </td>
                  <td className="px-3 py-3 text-xs tabular-nums text-slate-600">
                    {formatShortDate(loan.dueDate)}
                  </td>
                  <td className="py-3 pr-5 pl-3 text-right text-xs font-medium tabular-nums text-emerald-700">
                    {loan.returnedAt ? formatShortDate(loan.returnedAt) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

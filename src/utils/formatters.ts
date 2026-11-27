import type { AvailabilityStatus, Book, LoanRecord } from '../types/library';

export function getBookAvailability(book: Book): AvailabilityStatus {
  if (book.availableCopies <= 0) {
    return 'Checked Out';
  }
  if (book.availableCopies === 1 && book.totalCopies > 1) {
    return 'Low Stock';
  }
  return 'Available';
}

export function getLoanDueState(loan: LoanRecord): {
  label: 'Overdue' | 'Due Soon' | 'On Time' | 'Returned';
  daysDelta: number;
} {
  if (loan.status === 'Returned') {
    return { label: 'Returned', daysDelta: 0 };
  }
  const now = Date.now();
  const due = new Date(loan.dueDate).getTime();
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { label: 'Overdue', daysDelta: Math.abs(diffDays) };
  }
  if (diffDays <= 3) {
    return { label: 'Due Soon', daysDelta: diffDays };
  }
  return { label: 'On Time', daysDelta: diffDays };
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

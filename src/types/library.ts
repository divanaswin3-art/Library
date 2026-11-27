export type AvailabilityStatus = 'Available' | 'Low Stock' | 'Checked Out';

export type LoanStatus = 'Active' | 'Returned';

export type ActivityType = 'BORROW' | 'RETURN' | 'ADD_BOOK' | 'UPDATE_BOOK' | 'DELETE_BOOK' | 'EXTEND_LOAN' | 'IMPORT';

export interface Book {
  id: string;
  callNumber: string;
  isbn: string;
  title: string;
  author: string;
  genre: string;
  publicationYear: number;
  shelfLocation: string;
  totalCopies: number;
  availableCopies: number;
  addedAt: string;
}

export interface LoanRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  callNumber: string;
  borrowerName: string;
  memberId: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: LoanStatus;
  notes?: string;
}

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  bookId?: string;
  bookTitle: string;
  actor: string;
  detail: string;
  timestamp: string;
}

export interface StorageInfo {
  filePath: string;
  lastSavedAt: string;
  fileSizeBytes: number;
  bookArrayLength: number;
  loanArrayLength: number;
  activityArrayLength: number;
}

export interface LibrarySnapshot {
  books: Book[];
  loans: LoanRecord[];
  activities: ActivityEntry[];
  storageInfo: StorageInfo;
}

export interface BookInput {
  callNumber?: string;
  isbn: string;
  title: string;
  author: string;
  genre: string;
  publicationYear: number;
  shelfLocation: string;
  totalCopies: number;
}

export interface BorrowInput {
  bookId: string;
  borrowerName: string;
  memberId: string;
  loanDays: number;
  notes?: string;
}

import express, { Request, Response } from 'express';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import type {
  ActivityEntry,
  Book,
  BookInput,
  BorrowInput,
  LibrarySnapshot,
  LoanRecord,
} from './src/types/library.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'library-data.json');

interface PersistedLibraryData {
  books: Book[];
  loans: LoanRecord[];
  activities: ActivityEntry[];
  lastSavedAt: string;
}

function addDaysIso(baseDate: Date, days: number): string {
  const next = new Date(baseDate.getTime());
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function createSeedData(): PersistedLibraryData {
  const now = new Date();
  const daysAgo = (n: number) => addDaysIso(now, -n);
  const daysFromNow = (n: number) => addDaysIso(now, n);

  const books: Book[] = [
    {
      id: 'bk-101',
      callNumber: 'QA76.73.K58',
      isbn: '978-0201896831',
      title: 'The Art of Computer Programming, Vol. 1',
      author: 'Donald E. Knuth',
      genre: 'Computer Science',
      publicationYear: 1997,
      shelfLocation: 'Stack A-02',
      totalCopies: 4,
      availableCopies: 3,
      addedAt: daysAgo(120),
    },
    {
      id: 'bk-102',
      callNumber: 'QA76.76.D47',
      isbn: '978-0201633610',
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
      genre: 'Computer Science',
      publicationYear: 1994,
      shelfLocation: 'Stack A-04',
      totalCopies: 3,
      availableCopies: 1,
      addedAt: daysAgo(110),
    },
    {
      id: 'bk-103',
      callNumber: 'PR6029.R8',
      isbn: '978-0451524935',
      title: 'Nineteen Eighty-Four',
      author: 'George Orwell',
      genre: 'Literature',
      publicationYear: 1949,
      shelfLocation: 'Stack B-11',
      totalCopies: 5,
      availableCopies: 4,
      addedAt: daysAgo(95),
    },
    {
      id: 'bk-104',
      callNumber: 'PQ8180.17.A73',
      isbn: '978-0060883287',
      title: 'One Hundred Years of Solitude',
      author: 'Gabriel García Márquez',
      genre: 'Literature',
      publicationYear: 1967,
      shelfLocation: 'Stack B-14',
      totalCopies: 3,
      availableCopies: 3,
      addedAt: daysAgo(88),
    },
    {
      id: 'bk-105',
      callNumber: 'Q175.K95',
      isbn: '978-0226458120',
      title: 'The Structure of Scientific Revolutions',
      author: 'Thomas S. Kuhn',
      genre: 'Philosophy',
      publicationYear: 1962,
      shelfLocation: 'Stack C-03',
      totalCopies: 2,
      availableCopies: 0,
      addedAt: daysAgo(82),
    },
    {
      id: 'bk-106',
      callNumber: 'TS171.4.N67',
      isbn: '978-0465050659',
      title: 'The Design of Everyday Things',
      author: 'Don Norman',
      genre: 'Design',
      publicationYear: 2013,
      shelfLocation: 'Stack D-01',
      totalCopies: 4,
      availableCopies: 4,
      addedAt: daysAgo(75),
    },
    {
      id: 'bk-107',
      callNumber: 'QB981.S26',
      isbn: '978-0345539434',
      title: 'Cosmos',
      author: 'Carl Sagan',
      genre: 'Science',
      publicationYear: 1980,
      shelfLocation: 'Stack E-08',
      totalCopies: 4,
      availableCopies: 3,
      addedAt: daysAgo(64),
    },
    {
      id: 'bk-108',
      callNumber: 'CB69.B73',
      isbn: '978-0393317558',
      title: 'Guns, Germs, and Steel',
      author: 'Jared Diamond',
      genre: 'History',
      publicationYear: 1997,
      shelfLocation: 'Stack F-05',
      totalCopies: 3,
      availableCopies: 3,
      addedAt: daysAgo(50),
    },
    {
      id: 'bk-109',
      callNumber: 'HB171.K45',
      isbn: '978-0156001380',
      title: 'Thinking, Fast and Slow',
      author: 'Daniel Kahneman',
      genre: 'Economics',
      publicationYear: 2011,
      shelfLocation: 'Stack G-02',
      totalCopies: 3,
      availableCopies: 2,
      addedAt: daysAgo(41),
    },
    {
      id: 'bk-110',
      callNumber: 'Z250.B85',
      isbn: '978-0881792126',
      title: 'The Elements of Typographic Style',
      author: 'Robert Bringhurst',
      genre: 'Design',
      publicationYear: 2004,
      shelfLocation: 'Stack D-04',
      totalCopies: 2,
      availableCopies: 2,
      addedAt: daysAgo(29),
    },
    {
      id: 'bk-111',
      callNumber: 'QA76.9.A43',
      isbn: '978-0262046305',
      title: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
      genre: 'Computer Science',
      publicationYear: 2022,
      shelfLocation: 'Stack A-01',
      totalCopies: 5,
      availableCopies: 5,
      addedAt: daysAgo(19),
    },
    {
      id: 'bk-112',
      callNumber: 'D21.H37',
      isbn: '978-0062316097',
      title: 'Sapiens: A Brief History of Humankind',
      author: 'Yuval Noah Harari',
      genre: 'History',
      publicationYear: 2015,
      shelfLocation: 'Stack F-09',
      totalCopies: 4,
      availableCopies: 4,
      addedAt: daysAgo(12),
    },
  ];

  const loans: LoanRecord[] = [
    {
      id: 'ln-201',
      bookId: 'bk-105',
      bookTitle: 'The Structure of Scientific Revolutions',
      callNumber: 'Q175.K95',
      borrowerName: 'Elena Vance',
      memberId: 'MEM-4018',
      borrowedAt: daysAgo(18),
      dueDate: daysAgo(4),
      returnedAt: null,
      status: 'Active',
      notes: 'Research seminar reading',
    },
    {
      id: 'ln-202',
      bookId: 'bk-105',
      bookTitle: 'The Structure of Scientific Revolutions',
      callNumber: 'Q175.K95',
      borrowerName: 'Marcus Holloway',
      memberId: 'MEM-3892',
      borrowedAt: daysAgo(12),
      dueDate: daysFromNow(2),
      returnedAt: null,
      status: 'Active',
    },
    {
      id: 'ln-203',
      bookId: 'bk-102',
      bookTitle: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      callNumber: 'QA76.76.D47',
      borrowerName: 'Priya Nair',
      memberId: 'MEM-5104',
      borrowedAt: daysAgo(5),
      dueDate: daysFromNow(9),
      returnedAt: null,
      status: 'Active',
    },
    {
      id: 'ln-204',
      bookId: 'bk-102',
      bookTitle: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      callNumber: 'QA76.76.D47',
      borrowerName: 'Daniel Okafor',
      memberId: 'MEM-4421',
      borrowedAt: daysAgo(3),
      dueDate: daysFromNow(11),
      returnedAt: null,
      status: 'Active',
    },
    {
      id: 'ln-205',
      bookId: 'bk-101',
      bookTitle: 'The Art of Computer Programming, Vol. 1',
      callNumber: 'QA76.73.K58',
      borrowerName: 'Hannah Chen',
      memberId: 'MEM-3115',
      borrowedAt: daysAgo(6),
      dueDate: daysFromNow(8),
      returnedAt: null,
      status: 'Active',
    },
    {
      id: 'ln-206',
      bookId: 'bk-103',
      bookTitle: 'Nineteen Eighty-Four',
      callNumber: 'PR6029.R8',
      borrowerName: 'Lucas Bennett',
      memberId: 'MEM-2980',
      borrowedAt: daysAgo(2),
      dueDate: daysFromNow(12),
      returnedAt: null,
      status: 'Active',
    },
    {
      id: 'ln-207',
      bookId: 'bk-107',
      bookTitle: 'Cosmos',
      callNumber: 'QB981.S26',
      borrowerName: 'Sophia Lindqvist',
      memberId: 'MEM-4772',
      borrowedAt: daysAgo(7),
      dueDate: daysFromNow(7),
      returnedAt: null,
      status: 'Active',
    },
    {
      id: 'ln-208',
      bookId: 'bk-109',
      bookTitle: 'Thinking, Fast and Slow',
      callNumber: 'HB171.K45',
      borrowerName: 'Arjun Mehta',
      memberId: 'MEM-5219',
      borrowedAt: daysAgo(4),
      dueDate: daysFromNow(10),
      returnedAt: null,
      status: 'Active',
    },
    {
      id: 'ln-200',
      bookId: 'bk-106',
      bookTitle: 'The Design of Everyday Things',
      callNumber: 'TS171.4.N67',
      borrowerName: 'Clara Moreau',
      memberId: 'MEM-3340',
      borrowedAt: daysAgo(20),
      dueDate: daysAgo(6),
      returnedAt: daysAgo(7),
      status: 'Returned',
    },
  ];

  const activities: ActivityEntry[] = [
    {
      id: 'act-301',
      type: 'BORROW',
      bookId: 'bk-103',
      bookTitle: 'Nineteen Eighty-Four',
      actor: 'Lucas Bennett (MEM-2980)',
      detail: 'Checked out for 14 days',
      timestamp: daysAgo(2),
    },
    {
      id: 'act-302',
      type: 'BORROW',
      bookId: 'bk-102',
      bookTitle: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      actor: 'Daniel Okafor (MEM-4421)',
      detail: 'Checked out for 14 days',
      timestamp: daysAgo(3),
    },
    {
      id: 'act-303',
      type: 'BORROW',
      bookId: 'bk-109',
      bookTitle: 'Thinking, Fast and Slow',
      actor: 'Arjun Mehta (MEM-5219)',
      detail: 'Checked out for 14 days',
      timestamp: daysAgo(4),
    },
    {
      id: 'act-304',
      type: 'BORROW',
      bookId: 'bk-102',
      bookTitle: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      actor: 'Priya Nair (MEM-5104)',
      detail: 'Checked out for 14 days',
      timestamp: daysAgo(5),
    },
    {
      id: 'act-305',
      type: 'RETURN',
      bookId: 'bk-106',
      bookTitle: 'The Design of Everyday Things',
      actor: 'Clara Moreau (MEM-3340)',
      detail: 'Returned copy on time',
      timestamp: daysAgo(7),
    },
    {
      id: 'act-306',
      type: 'ADD_BOOK',
      bookId: 'bk-112',
      bookTitle: 'Sapiens: A Brief History of Humankind',
      actor: 'Library Desk',
      detail: 'Added 4 copies to Stack F-09',
      timestamp: daysAgo(12),
    },
  ];

  return {
    books,
    loans,
    activities,
    lastSavedAt: now.toISOString(),
  };
}

let writeQueue: Promise<void> = Promise.resolve();
let state: PersistedLibraryData = createSeedData();
let fileSizeBytes = 0;

async function persistToFile(): Promise<void> {
  state.lastSavedAt = new Date().toISOString();
  const serialized = JSON.stringify(state, null, 2);

  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, serialized, 'utf-8');
    const stats = await fs.stat(DATA_FILE);
    fileSizeBytes = stats.size;
  });

  await writeQueue;
}

async function loadFromFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<PersistedLibraryData>;
    if (
      Array.isArray(parsed.books) &&
      Array.isArray(parsed.loans) &&
      Array.isArray(parsed.activities)
    ) {
      state = {
        books: parsed.books,
        loans: parsed.loans,
        activities: parsed.activities,
        lastSavedAt: typeof parsed.lastSavedAt === 'string' ? parsed.lastSavedAt : new Date().toISOString(),
      };
      const stats = await fs.stat(DATA_FILE);
      fileSizeBytes = stats.size;
      return;
    }
  } catch {
    // Initialize file with curated starter arrays if missing or invalid
  }

  state = createSeedData();
  await persistToFile();
}

function getSnapshot(): LibrarySnapshot {
  return {
    books: state.books,
    loans: state.loans,
    activities: state.activities,
    storageInfo: {
      filePath: 'data/library-data.json',
      lastSavedAt: state.lastSavedAt,
      fileSizeBytes,
      bookArrayLength: state.books.length,
      loanArrayLength: state.loans.length,
      activityArrayLength: state.activities.length,
    },
  };
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function generateCallNumber(genre: string, author: string): string {
  const genrePrefix = (genre || 'GEN')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 2)
    .toUpperCase()
    .padEnd(2, 'X');
  const authorCode = (author || 'AUT')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'A');
  const num = Math.floor(100 + Math.random() * 899);
  return `${genrePrefix}${num}.${authorCode}`;
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value == null ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function startServer() {
  await loadFromFile();

  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/library', (_req: Request, res: Response) => {
    res.json(getSnapshot());
  });

  app.post('/api/books', async (req: Request, res: Response) => {
    const body = req.body as Partial<BookInput>;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const author = typeof body.author === 'string' ? body.author.trim() : '';
    const isbn = typeof body.isbn === 'string' ? body.isbn.trim() : '';
    const genre = typeof body.genre === 'string' ? body.genre.trim() : '';
    const shelfLocation = typeof body.shelfLocation === 'string' ? body.shelfLocation.trim() : '';
    const publicationYear = Number(body.publicationYear);
    const totalCopies = Number(body.totalCopies);
    const callNumberInput = typeof body.callNumber === 'string' ? body.callNumber.trim() : '';

    if (!title || !author || !isbn || !genre || !shelfLocation) {
      res.status(400).json({ error: 'Title, author, ISBN, genre, and shelf location are required.' });
      return;
    }

    if (!Number.isInteger(publicationYear) || publicationYear < 1000 || publicationYear > 2100) {
      res.status(400).json({ error: 'Publication year must be a valid four-digit year.' });
      return;
    }

    if (!Number.isInteger(totalCopies) || totalCopies < 1 || totalCopies > 500) {
      res.status(400).json({ error: 'Total copies must be a whole number between 1 and 500.' });
      return;
    }

    const duplicate = state.books.find(
      (b) => b.isbn.toLowerCase() === isbn.toLowerCase()
    );
    if (duplicate) {
      res.status(409).json({ error: `A book with ISBN ${isbn} already exists in the catalog.` });
      return;
    }

    const nowIso = new Date().toISOString();
    const newBook: Book = {
      id: generateId('bk'),
      callNumber: callNumberInput || generateCallNumber(genre, author),
      isbn,
      title,
      author,
      genre,
      publicationYear,
      shelfLocation,
      totalCopies,
      availableCopies: totalCopies,
      addedAt: nowIso,
    };

    state.books = [newBook, ...state.books];
    state.activities = [
      {
        id: generateId('act'),
        type: 'ADD_BOOK',
        bookId: newBook.id,
        bookTitle: newBook.title,
        actor: 'Library Desk',
        detail: `Added ${newBook.totalCopies} ${newBook.totalCopies === 1 ? 'copy' : 'copies'} at ${newBook.shelfLocation}`,
        timestamp: nowIso,
      },
      ...state.activities,
    ];

    await persistToFile();
    res.status(201).json(getSnapshot());
  });

  app.put('/api/books/:id', async (req: Request, res: Response) => {
    const bookId = req.params.id;
    const bookIndex = state.books.findIndex((b) => b.id === bookId);
    if (bookIndex === -1) {
      res.status(404).json({ error: 'Book not found.' });
      return;
    }

    const existing = state.books[bookIndex];
    const body = req.body as Partial<BookInput>;
    const title = typeof body.title === 'string' ? body.title.trim() : existing.title;
    const author = typeof body.author === 'string' ? body.author.trim() : existing.author;
    const isbn = typeof body.isbn === 'string' ? body.isbn.trim() : existing.isbn;
    const genre = typeof body.genre === 'string' ? body.genre.trim() : existing.genre;
    const shelfLocation =
      typeof body.shelfLocation === 'string' ? body.shelfLocation.trim() : existing.shelfLocation;
    const callNumber =
      typeof body.callNumber === 'string' && body.callNumber.trim()
        ? body.callNumber.trim()
        : existing.callNumber;
    const publicationYear =
      body.publicationYear !== undefined ? Number(body.publicationYear) : existing.publicationYear;
    const totalCopies =
      body.totalCopies !== undefined ? Number(body.totalCopies) : existing.totalCopies;

    if (!title || !author || !isbn || !genre || !shelfLocation) {
      res.status(400).json({ error: 'All book fields must be non-empty.' });
      return;
    }

    if (!Number.isInteger(publicationYear) || publicationYear < 1000 || publicationYear > 2100) {
      res.status(400).json({ error: 'Publication year must be a valid four-digit year.' });
      return;
    }

    if (!Number.isInteger(totalCopies) || totalCopies < 1 || totalCopies > 500) {
      res.status(400).json({ error: 'Total copies must be a whole number between 1 and 500.' });
      return;
    }

    const activeLoanCount = state.loans.filter(
      (l) => l.bookId === bookId && l.status === 'Active'
    ).length;

    if (totalCopies < activeLoanCount) {
      res.status(400).json({
        error: `Cannot reduce total copies below ${activeLoanCount} because ${activeLoanCount} ${activeLoanCount === 1 ? 'copy is' : 'copies are'} currently borrowed.`,
      });
      return;
    }

    const duplicateIsbn = state.books.find(
      (b) => b.id !== bookId && b.isbn.toLowerCase() === isbn.toLowerCase()
    );
    if (duplicateIsbn) {
      res.status(409).json({ error: `Another catalog entry already uses ISBN ${isbn}.` });
      return;
    }

    const updatedBook: Book = {
      ...existing,
      title,
      author,
      isbn,
      genre,
      shelfLocation,
      callNumber,
      publicationYear,
      totalCopies,
      availableCopies: totalCopies - activeLoanCount,
    };

    const nextBooks = [...state.books];
    nextBooks[bookIndex] = updatedBook;
    state.books = nextBooks;

    // Keep book title / callNumber synced on active loans
    state.loans = state.loans.map((loan) =>
      loan.bookId === bookId
        ? { ...loan, bookTitle: updatedBook.title, callNumber: updatedBook.callNumber }
        : loan
    );

    const nowIso = new Date().toISOString();
    state.activities = [
      {
        id: generateId('act'),
        type: 'UPDATE_BOOK',
        bookId: updatedBook.id,
        bookTitle: updatedBook.title,
        actor: 'Library Desk',
        detail: `Updated record (${updatedBook.availableCopies}/${updatedBook.totalCopies} available)`,
        timestamp: nowIso,
      },
      ...state.activities,
    ];

    await persistToFile();
    res.json(getSnapshot());
  });

  app.delete('/api/books/:id', async (req: Request, res: Response) => {
    const bookId = req.params.id;
    const book = state.books.find((b) => b.id === bookId);
    if (!book) {
      res.status(404).json({ error: 'Book not found.' });
      return;
    }

    const activeLoans = state.loans.filter(
      (l) => l.bookId === bookId && l.status === 'Active'
    );
    if (activeLoans.length > 0) {
      res.status(409).json({
        error: `Cannot remove "${book.title}" while ${activeLoans.length} ${activeLoans.length === 1 ? 'copy is' : 'copies are'} checked out. Return all copies first.`,
      });
      return;
    }

    state.books = state.books.filter((b) => b.id !== bookId);
    const nowIso = new Date().toISOString();
    state.activities = [
      {
        id: generateId('act'),
        type: 'DELETE_BOOK',
        bookId: book.id,
        bookTitle: book.title,
        actor: 'Library Desk',
        detail: `Removed catalog record (${book.callNumber})`,
        timestamp: nowIso,
      },
      ...state.activities,
    ];

    await persistToFile();
    res.json(getSnapshot());
  });

  app.post('/api/loans/borrow', async (req: Request, res: Response) => {
    const body = req.body as Partial<BorrowInput>;
    const bookId = typeof body.bookId === 'string' ? body.bookId.trim() : '';
    const borrowerName = typeof body.borrowerName === 'string' ? body.borrowerName.trim() : '';
    const memberId = typeof body.memberId === 'string' ? body.memberId.trim() : '';
    const loanDays = Number(body.loanDays ?? 14);
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';

    if (!bookId || !borrowerName || !memberId) {
      res.status(400).json({ error: 'Book selection, borrower name, and member ID are required.' });
      return;
    }

    if (!Number.isInteger(loanDays) || loanDays < 1 || loanDays > 90) {
      res.status(400).json({ error: 'Loan duration must be between 1 and 90 days.' });
      return;
    }

    const bookIndex = state.books.findIndex((b) => b.id === bookId);
    if (bookIndex === -1) {
      res.status(404).json({ error: 'Selected book was not found in the catalog.' });
      return;
    }

    const book = state.books[bookIndex];
    if (book.availableCopies <= 0) {
      res.status(409).json({ error: `All copies of "${book.title}" are currently checked out.` });
      return;
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const dueDate = addDaysIso(now, loanDays);

    const updatedBook: Book = {
      ...book,
      availableCopies: book.availableCopies - 1,
    };
    const nextBooks = [...state.books];
    nextBooks[bookIndex] = updatedBook;
    state.books = nextBooks;

    const newLoan: LoanRecord = {
      id: generateId('ln'),
      bookId: book.id,
      bookTitle: book.title,
      callNumber: book.callNumber,
      borrowerName,
      memberId,
      borrowedAt: nowIso,
      dueDate,
      returnedAt: null,
      status: 'Active',
      ...(notes ? { notes } : {}),
    };

    state.loans = [newLoan, ...state.loans];
    state.activities = [
      {
        id: generateId('act'),
        type: 'BORROW',
        bookId: book.id,
        bookTitle: book.title,
        actor: `${borrowerName} (${memberId})`,
        detail: `Checked out for ${loanDays} days`,
        timestamp: nowIso,
      },
      ...state.activities,
    ];

    await persistToFile();
    res.status(201).json(getSnapshot());
  });

  app.post('/api/loans/:loanId/return', async (req: Request, res: Response) => {
    const loanId = req.params.loanId;
    const loanIndex = state.loans.findIndex((l) => l.id === loanId);
    if (loanIndex === -1) {
      res.status(404).json({ error: 'Loan record not found.' });
      return;
    }

    const loan = state.loans[loanIndex];
    if (loan.status === 'Returned') {
      res.status(409).json({ error: 'This loan has already been marked as returned.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const wasOverdue = new Date(loan.dueDate).getTime() < Date.now();

    const nextLoans = [...state.loans];
    nextLoans[loanIndex] = {
      ...loan,
      status: 'Returned',
      returnedAt: nowIso,
    };
    state.loans = nextLoans;

    const bookIndex = state.books.findIndex((b) => b.id === loan.bookId);
    if (bookIndex !== -1) {
      const book = state.books[bookIndex];
      const nextBooks = [...state.books];
      nextBooks[bookIndex] = {
        ...book,
        availableCopies: Math.min(book.totalCopies, book.availableCopies + 1),
      };
      state.books = nextBooks;
    }

    state.activities = [
      {
        id: generateId('act'),
        type: 'RETURN',
        bookId: loan.bookId,
        bookTitle: loan.bookTitle,
        actor: `${loan.borrowerName} (${loan.memberId})`,
        detail: wasOverdue ? 'Returned copy (past due date)' : 'Returned copy on time',
        timestamp: nowIso,
      },
      ...state.activities,
    ];

    await persistToFile();
    res.json(getSnapshot());
  });

  app.post('/api/loans/:loanId/extend', async (req: Request, res: Response) => {
    const loanId = req.params.loanId;
    const extraDays = Number(req.body?.days ?? 7);
    const loanIndex = state.loans.findIndex((l) => l.id === loanId);
    if (loanIndex === -1) {
      res.status(404).json({ error: 'Loan record not found.' });
      return;
    }

    const loan = state.loans[loanIndex];
    if (loan.status !== 'Active') {
      res.status(409).json({ error: 'Cannot extend a loan that has already been returned.' });
      return;
    }

    const currentDue = new Date(loan.dueDate);
    const base = currentDue.getTime() < Date.now() ? new Date() : currentDue;
    const nextDue = addDaysIso(base, Number.isInteger(extraDays) && extraDays > 0 ? extraDays : 7);

    const nextLoans = [...state.loans];
    nextLoans[loanIndex] = {
      ...loan,
      dueDate: nextDue,
    };
    state.loans = nextLoans;

    const nowIso = new Date().toISOString();
    state.activities = [
      {
        id: generateId('act'),
        type: 'EXTEND_LOAN',
        bookId: loan.bookId,
        bookTitle: loan.bookTitle,
        actor: `${loan.borrowerName} (${loan.memberId})`,
        detail: `Extended due date by ${extraDays} days`,
        timestamp: nowIso,
      },
      ...state.activities,
    ];

    await persistToFile();
    res.json(getSnapshot());
  });

  app.post('/api/library/import', async (req: Request, res: Response) => {
    const incomingBooks = req.body?.books;
    if (!Array.isArray(incomingBooks) || incomingBooks.length === 0) {
      res.status(400).json({ error: 'Provide a non-empty JSON array of books to import.' });
      return;
    }

    const nowIso = new Date().toISOString();
    let addedCount = 0;
    let skippedCount = 0;
    const addedBooks: Book[] = [];

    for (const raw of incomingBooks) {
      if (!raw || typeof raw !== 'object') {
        skippedCount += 1;
        continue;
      }
      const title = typeof raw.title === 'string' ? raw.title.trim() : '';
      const author = typeof raw.author === 'string' ? raw.author.trim() : '';
      const isbn = typeof raw.isbn === 'string' ? raw.isbn.trim() : '';
      const genre = typeof raw.genre === 'string' ? raw.genre.trim() : 'General';
      const shelfLocation =
        typeof raw.shelfLocation === 'string' && raw.shelfLocation.trim()
          ? raw.shelfLocation.trim()
          : 'Stack Z-01';
      const publicationYear = Number.isInteger(Number(raw.publicationYear))
        ? Number(raw.publicationYear)
        : new Date().getFullYear();
      const totalCopies =
        Number.isInteger(Number(raw.totalCopies)) && Number(raw.totalCopies) >= 1
          ? Math.min(500, Number(raw.totalCopies))
          : 1;

      if (!title || !author || !isbn) {
        skippedCount += 1;
        continue;
      }

      const exists =
        state.books.some((b) => b.isbn.toLowerCase() === isbn.toLowerCase()) ||
        addedBooks.some((b) => b.isbn.toLowerCase() === isbn.toLowerCase());
      if (exists) {
        skippedCount += 1;
        continue;
      }

      addedBooks.push({
        id: generateId('bk'),
        callNumber:
          typeof raw.callNumber === 'string' && raw.callNumber.trim()
            ? raw.callNumber.trim()
            : generateCallNumber(genre, author),
        isbn,
        title,
        author,
        genre,
        publicationYear,
        shelfLocation,
        totalCopies,
        availableCopies: totalCopies,
        addedAt: nowIso,
      });
      addedCount += 1;
    }

    if (addedCount === 0) {
      res.status(400).json({
        error: `No new books were imported (${skippedCount} invalid or duplicate ISBN entries skipped).`,
      });
      return;
    }

    state.books = [...addedBooks, ...state.books];
    state.activities = [
      {
        id: generateId('act'),
        type: 'IMPORT',
        bookTitle: `${addedCount} Imported ${addedCount === 1 ? 'Title' : 'Titles'}`,
        actor: 'File Import',
        detail: `Imported ${addedCount} books (${skippedCount} skipped)`,
        timestamp: nowIso,
      },
      ...state.activities,
    ];

    await persistToFile();
    res.json({
      snapshot: getSnapshot(),
      imported: addedCount,
      skipped: skippedCount,
    });
  });

  app.post('/api/library/reset', async (_req: Request, res: Response) => {
    state = createSeedData();
    await persistToFile();
    res.json(getSnapshot());
  });

  app.get('/api/library/export/json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="library-data.json"');
    res.send(JSON.stringify(state, null, 2));
  });

  app.get('/api/library/export/csv', (_req: Request, res: Response) => {
    const header = [
      'ID',
      'Call Number',
      'ISBN',
      'Title',
      'Author',
      'Genre',
      'Year',
      'Shelf Location',
      'Available Copies',
      'Total Copies',
    ];
    const rows = state.books.map((b) =>
      [
        b.id,
        b.callNumber,
        b.isbn,
        b.title,
        b.author,
        b.genre,
        b.publicationYear,
        b.shelfLocation,
        b.availableCopies,
        b.totalCopies,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="library-catalog.csv"');
    res.send(csv);
  });

  const isProd =
    process.env.NODE_ENV === 'production' ||
    (fsSync.existsSync(path.resolve(__dirname, 'dist/index.html')) &&
      __filename.endsWith('server.js'));

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Folio Library server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start Folio Library server:', error);
  process.exit(1);
});

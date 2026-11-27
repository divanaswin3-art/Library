import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Book, BookInput } from '../types/library';

interface BookModalProps {
  isOpen: boolean;
  editingBook: Book | null;
  onClose: () => void;
  onSubmit: (input: BookInput, bookId?: string) => Promise<void>;
}

const GENRE_SUGGESTIONS = [
  'Computer Science',
  'Literature',
  'History',
  'Science',
  'Philosophy',
  'Design',
  'Economics',
  'Mathematics',
  'Biography',
];

export function BookModal({ isOpen, editingBook, onClose, onSubmit }: BookModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [callNumber, setCallNumber] = useState('');
  const [genre, setGenre] = useState('Computer Science');
  const [publicationYear, setPublicationYear] = useState(String(new Date().getFullYear()));
  const [shelfLocation, setShelfLocation] = useState('');
  const [totalCopies, setTotalCopies] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingBook) {
      setTitle(editingBook.title);
      setAuthor(editingBook.author);
      setIsbn(editingBook.isbn);
      setCallNumber(editingBook.callNumber);
      setGenre(editingBook.genre);
      setPublicationYear(String(editingBook.publicationYear));
      setShelfLocation(editingBook.shelfLocation);
      setTotalCopies(String(editingBook.totalCopies));
    } else {
      setTitle('');
      setAuthor('');
      setIsbn('');
      setCallNumber('');
      setGenre('Computer Science');
      setPublicationYear(String(new Date().getFullYear()));
      setShelfLocation('Stack A-01');
      setTotalCopies('2');
    }
  }, [isOpen, editingBook]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const borrowedCount = editingBook
    ? editingBook.totalCopies - editingBook.availableCopies
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedYear = Number(publicationYear);
    const parsedCopies = Number(totalCopies);

    if (!title.trim() || !author.trim() || !isbn.trim() || !genre.trim() || !shelfLocation.trim()) {
      setError('Please complete all required catalog fields.');
      return;
    }

    if (!Number.isInteger(parsedYear) || parsedYear < 1000 || parsedYear > 2100) {
      setError('Enter a valid four-digit publication year.');
      return;
    }

    if (!Number.isInteger(parsedCopies) || parsedCopies < 1) {
      setError('Total copies must be at least 1.');
      return;
    }

    if (editingBook && parsedCopies < borrowedCount) {
      setError(
        `At least ${borrowedCount} ${borrowedCount === 1 ? 'copy is' : 'copies are'} currently checked out.`
      );
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(
        {
          title: title.trim(),
          author: author.trim(),
          isbn: isbn.trim(),
          callNumber: callNumber.trim() || undefined,
          genre: genre.trim(),
          publicationYear: parsedYear,
          shelfLocation: shelfLocation.trim(),
          totalCopies: parsedCopies,
        },
        editingBook?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save book.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-modal-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="book-modal-title" className="text-base font-semibold text-slate-900">
            {editingBook ? 'Edit Catalog Record' : 'Add Book to Catalog'}
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

          <div>
            <label htmlFor="book-title" className="mb-1.5 block text-xs font-medium text-slate-700">
              Book Title
            </label>
            <input
              id="book-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Clean Code: A Handbook of Agile Software Craftsmanship"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="book-author" className="mb-1.5 block text-xs font-medium text-slate-700">
                Author(s)
              </label>
              <input
                id="book-author"
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g., Robert C. Martin"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
              />
            </div>

            <div>
              <label htmlFor="book-isbn" className="mb-1.5 block text-xs font-medium text-slate-700">
                ISBN
              </label>
              <input
                id="book-isbn"
                type="text"
                required
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-0132350884"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="book-genre" className="mb-1.5 block text-xs font-medium text-slate-700">
                Subject / Genre
              </label>
              <input
                id="book-genre"
                list="genre-options"
                required
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
              />
              <datalist id="genre-options">
                {GENRE_SUGGESTIONS.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="book-call" className="mb-1.5 block text-xs font-medium text-slate-700">
                Call Number <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="book-call"
                type="text"
                value={callNumber}
                onChange={(e) => setCallNumber(e.target.value)}
                placeholder="Auto-assigned if blank"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="book-shelf" className="mb-1.5 block text-xs font-medium text-slate-700">
                Shelf Location
              </label>
              <input
                id="book-shelf"
                type="text"
                required
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                placeholder="Stack A-05"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
              />
            </div>

            <div>
              <label htmlFor="book-year" className="mb-1.5 block text-xs font-medium text-slate-700">
                Pub. Year
              </label>
              <input
                id="book-year"
                type="number"
                min={1000}
                max={2100}
                required
                value={publicationYear}
                onChange={(e) => setPublicationYear(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
              />
            </div>

            <div>
              <label htmlFor="book-copies" className="mb-1.5 block text-xs font-medium text-slate-700">
                Total Copies
              </label>
              <input
                id="book-copies"
                type="number"
                min={Math.max(1, borrowedCount)}
                max={500}
                required
                value={totalCopies}
                onChange={(e) => setTotalCopies(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
              />
              {editingBook && borrowedCount > 0 && (
                <p className="mt-1 text-xs text-slate-500 tabular-nums">
                  {borrowedCount} currently borrowed
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 whitespace-nowrap shrink-0"
            >
              {submitting ? 'Saving...' : editingBook ? 'Save Changes' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

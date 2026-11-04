// ============================================================
//  IndexedDB helpers via localforage
//  All book data (metadata + raw PDF bytes) live here.
// ============================================================
import localforage from "localforage";

const booksStore = localforage.createInstance({ name: "fitwithmaya", storeName: "books" });
const progressStore = localforage.createInstance({ name: "fitwithmaya", storeName: "progress" });

// ── Books ────────────────────────────────────────────────────

/** Save a new book record. */
export async function saveBook(book) {
  await booksStore.setItem(book.id, book);
  return book;
}

/** Update only metadata fields of an existing book (title, author, category, description, price, cover). */
export async function updateBook(id, fields) {
  const existing = await booksStore.getItem(id);
  if (!existing) throw new Error("Book not found: " + id);
  const updated = { ...existing, ...fields, updatedAt: Date.now() };
  await booksStore.setItem(id, updated);
  return updated;
}

/** Load all books, sorted newest-first. */
export async function getAllBooks() {
  const books = [];
  await booksStore.iterate((value) => { books.push(value); });
  return books.sort((a, b) => b.createdAt - a.createdAt);
}

/** Load a single book by id. */
export async function getBook(id) {
  return booksStore.getItem(id);
}

/** Delete a book and its reading progress. */
export async function deleteBook(id) {
  await booksStore.removeItem(id);
  await progressStore.removeItem(id);
}

// ── Reading Progress ─────────────────────────────────────────

/** Save last-read page (0-indexed). */
export async function saveProgress(bookId, page) {
  await progressStore.setItem(bookId, { bookId, page, updatedAt: Date.now() });
}

/** Get last-read page for a book. Returns 0 if none. */
export async function getProgress(bookId) {
  const p = await progressStore.getItem(bookId);
  return p ? p.page : 0;
}

/** Get progress for ALL books at once (returns {bookId: page} map). */
export async function getAllProgress() {
  const map = {};
  await progressStore.iterate((value, key) => { map[key] = value.page; });
  return map;
}

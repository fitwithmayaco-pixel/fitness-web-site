// ============================================================
//  Database layer: Supabase Cloud Database + Storage
//  with automatic localforage (IndexedDB) fallback
// ============================================================
import localforage from "localforage";
import { supabase, isSupabaseConfigured, uploadToStorage, deleteFromStorage } from "./supabase";
import { dataURLtoBlob } from "./helpers";

// Local storage instances (fallback & offline caching)
const booksStore = localforage.createInstance({ name: "fitwithmaya", storeName: "books" });
const progressStore = localforage.createInstance({ name: "fitwithmaya", storeName: "progress" });

// Helper to get current authenticated Supabase user ID if any
async function getCurrentUserId() {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
}

// ── Books ────────────────────────────────────────────────────

/** Save a new book record (Cloud Supabase or local IndexedDB). */
export async function saveBook(book) {
  if (isSupabaseConfigured() && supabase) {
    let pdfUrl = book.pdfUrl || "";
    let coverUrl = book.cover || "";

    // 1. Upload PDF file/buffer to Supabase Storage
    if (book.pdfFile || book.pdfData) {
      const pdfPayload = book.pdfFile || new Blob([book.pdfData], { type: "application/pdf" });
      const pdfPath = `pdfs/${book.id}.pdf`;
      pdfUrl = await uploadToStorage("ebooks", pdfPath, pdfPayload, "application/pdf");
    }

    // 2. Upload cover if it's a dataURL / Blob
    if (coverUrl && coverUrl.startsWith("data:")) {
      try {
        const coverBlob = dataURLtoBlob(coverUrl);
        const coverPath = `covers/${book.id}.png`;
        coverUrl = await uploadToStorage("ebooks", coverPath, coverBlob, "image/png");
      } catch (err) {
        console.warn("Could not upload cover to storage, using fallback:", err);
      }
    }

    const userId = await getCurrentUserId();

    const bookRow = {
      id: book.id,
      title: book.title,
      author: book.author || "Unknown Author",
      category: book.category || "Wellness",
      description: book.description || "",
      price: book.price ? String(book.price) : "",
      cover_url: coverUrl,
      pdf_url: pdfUrl,
      page_count: book.pageCount || 0,
      file_size: book.fileSize || 0,
      user_id: userId,
      created_at: new Date(book.createdAt || Date.now()).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("books").insert([bookRow]).select().single();
    if (error) {
      console.error("Supabase insert book error:", error);
      throw error;
    }

    // Cache locally
    const formatted = mapBookRow(data);
    await booksStore.setItem(book.id, { ...formatted, pdfData: pdfUrl });
    return formatted;
  }

  // Fallback: localforage
  await booksStore.setItem(book.id, book);
  return book;
}

/** Update metadata (and optionally cover/PDF) of an existing book. */
export async function updateBook(id, fields) {
  if (isSupabaseConfigured() && supabase) {
    const updateData = { updated_at: new Date().toISOString() };

    if (fields.title !== undefined) updateData.title = fields.title;
    if (fields.author !== undefined) updateData.author = fields.author;
    if (fields.category !== undefined) updateData.category = fields.category;
    if (fields.description !== undefined) updateData.description = fields.description;
    if (fields.price !== undefined) updateData.price = String(fields.price);

    // If new cover provided
    if (fields.cover && fields.cover.startsWith("data:")) {
      try {
        const coverBlob = dataURLtoBlob(fields.cover);
        const coverPath = `covers/${id}_${Date.now()}.png`;
        updateData.cover_url = await uploadToStorage("ebooks", coverPath, coverBlob, "image/png");
      } catch (err) {
        console.warn("Failed to upload updated cover:", err);
      }
    } else if (fields.cover) {
      updateData.cover_url = fields.cover;
    }

    // If new PDF provided
    if (fields.pdfFile || fields.pdfData) {
      const pdfPayload = fields.pdfFile || new Blob([fields.pdfData], { type: "application/pdf" });
      const pdfPath = `pdfs/${id}_${Date.now()}.pdf`;
      updateData.pdf_url = await uploadToStorage("ebooks", pdfPath, pdfPayload, "application/pdf");
      if (fields.pageCount) updateData.page_count = fields.pageCount;
      if (fields.fileSize) updateData.file_size = fields.fileSize;
    }

    const { data, error } = await supabase
      .from("books")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    const formatted = mapBookRow(data);
    await booksStore.setItem(id, { ...formatted, pdfData: formatted.pdfUrl });
    return formatted;
  }

  // Fallback: localforage
  const existing = await booksStore.getItem(id);
  if (!existing) throw new Error("Book not found: " + id);
  const updated = { ...existing, ...fields, updatedAt: Date.now() };
  await booksStore.setItem(id, updated);
  return updated;
}

/** Load all books (newest first). */
export async function getAllBooks() {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase getAllBooks error:", error);
        throw error;
      }
      return (data || []).map(mapBookRow);
    } catch (err) {
      console.warn("Falling back to local storage:", err);
    }
  }

  // Fallback: localforage
  const books = [];
  await booksStore.iterate((value) => { books.push(value); });
  return books.sort((a, b) => b.createdAt - a.createdAt);
}

/** Load a single book by id. */
export async function getBook(id) {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        return mapBookRow(data);
      }
    } catch (err) {
      console.warn("Error fetching book from Supabase, checking local:", err);
    }
  }

  // Fallback: localforage
  return booksStore.getItem(id);
}

/** Delete a book and its reading progress. */
export async function deleteBook(id) {
  if (isSupabaseConfigured() && supabase) {
    try {
      // Delete storage files
      await deleteFromStorage("ebooks", [`pdfs/${id}.pdf`, `covers/${id}.png`]);
      // Delete from database
      await supabase.from("books").delete().eq("id", id);
      await supabase.from("reading_progress").delete().eq("book_id", id);
    } catch (err) {
      console.error("Supabase deleteBook error:", err);
    }
  }

  // Also clean localforage
  await booksStore.removeItem(id);
  await progressStore.removeItem(id);
}

// ── Reading Progress ─────────────────────────────────────────

/** Save last-read page (0-indexed). */
export async function saveProgress(bookId, page) {
  // Always update localforage for instant offline response
  await progressStore.setItem(bookId, { bookId, page, updatedAt: Date.now() });

  if (isSupabaseConfigured() && supabase) {
    const userId = await getCurrentUserId();
    if (userId) {
      try {
        await supabase.from("reading_progress").upsert(
          {
            user_id: userId,
            book_id: bookId,
            page,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,book_id" }
        );
      } catch (err) {
        console.warn("Could not sync progress to Supabase:", err);
      }
    }
  }
}

/** Get last-read page for a book. Returns 0 if none. */
export async function getProgress(bookId) {
  if (isSupabaseConfigured() && supabase) {
    const userId = await getCurrentUserId();
    if (userId) {
      try {
        const { data } = await supabase
          .from("reading_progress")
          .select("page")
          .eq("user_id", userId)
          .eq("book_id", bookId)
          .maybeSingle();

        if (data && typeof data.page === "number") {
          return data.page;
        }
      } catch (err) {
        console.warn("Could not fetch progress from Supabase:", err);
      }
    }
  }

  const p = await progressStore.getItem(bookId);
  return p ? p.page : 0;
}

/** Get progress for ALL books at once (returns {bookId: page} map). */
export async function getAllProgress() {
  const map = {};

  if (isSupabaseConfigured() && supabase) {
    const userId = await getCurrentUserId();
    if (userId) {
      try {
        const { data } = await supabase
          .from("reading_progress")
          .select("book_id, page")
          .eq("user_id", userId);

        if (data) {
          data.forEach((r) => { map[r.book_id] = r.page; });
          return map;
        }
      } catch (err) {
        console.warn("Could not fetch all progress from Supabase:", err);
      }
    }
  }

  await progressStore.iterate((value, key) => { map[key] = value.page; });
  return map;
}

// ── Helpers ──────────────────────────────────────────────────

function mapBookRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    category: row.category,
    description: row.description,
    price: row.price,
    cover: row.cover_url,
    pdfUrl: row.pdf_url,
    pdfData: row.pdf_url, // For reader compatibility
    pageCount: row.page_count,
    fileSize: row.file_size,
    userId: row.user_id,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  };
}

import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import { getAllBooks, deleteBook, saveBook } from "../utils/db";
import { CATEGORIES } from "../config";
import { uid, formatBytes, readFileAsArrayBuffer, readFileAsDataURL } from "../utils/helpers";
import { loadPDF, generateCover } from "../utils/pdfUtils";
import "./Admin.css";
import "./Upload.css";

const DEFAULT_GUMROAD_LINK = "https://mayafit.gumroad.com/l/uylist?_gl=1*1i5m33n*_ga*NzIyNTUyMDk3LjE3OTQzMDIzNjk.*_ga_6LJN6D94N6*czE3OTQ1NzIyNzckbzYkZzAkdDE3OTQ1NzIyODAkajU3JGwwJGgw";

const INITIAL_FORM = {
  title: "",
  author: "Maya Fit",
  category: "Workout Guides",
  description: "",
  price: "",
  link: DEFAULT_GUMROAD_LINK,
};

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, userRole, loading: authLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("books"); // 'books' | 'upload' | 'roles'
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Upload Form states (Thumbnail + Link)
  const [form, setForm] = useState(INITIAL_FORM);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const loadAllBooks = async () => {
    setLoadingBooks(true);
    try {
      const data = await getAllBooks();
      setBooks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBooks(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAllBooks();
    }
  }, [isAdmin]);

  // Handle Delete book
  const handleDeleteBook = async (id) => {
    if (!window.confirm("Are you sure you want to delete this book? This will permanently remove it from Supabase storage & database.")) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteBook(id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete book: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Upload helpers (Thumbnail Image + Gumroad Link)
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onThumbnailDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files[0] || e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please drop or select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError(`Image size (${formatBytes(file.size)}) is too large. Max allowed is 20 MB.`);
      return;
    }

    setThumbnailFile(file);
    setUploadError("");
    const dataUrl = await readFileAsDataURL(file);
    setThumbnailPreview(dataUrl);

    if (!form.title) {
      const name = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setForm((f) => ({ ...f, title: name.charAt(0).toUpperCase() + name.slice(1) }));
    }
  }, [form.title]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setUploadError("Please enter a title."); return; }
    if (!form.link.trim()) { setUploadError("Please enter the Gumroad or product link."); return; }
    if (!thumbnailPreview && !thumbnailFile) {
      setUploadError("Please select or drop a thumbnail image for this e-book.");
      return;
    }

    try {
      setUploadStatus("processing");
      setUploadProgress(25);
      setUploadError("");
      setUploadSuccess("");

      const id = uid();
      setUploadProgress(60);

      await saveBook({
        id,
        title: form.title.trim(),
        author: form.author.trim() || "Maya Fit",
        category: form.category || "Wellness",
        description: form.description.trim(),
        price: form.price.trim(),
        link: form.link.trim(),
        cover: thumbnailPreview,
        coverFile: thumbnailFile,
        createdAt: Date.now(),
      });

      setUploadProgress(100);
      setUploadStatus("done");
      setUploadSuccess(`🎉 E-Book "${form.title}" successfully published!`);

      // Refresh books list
      loadAllBooks();

      setTimeout(() => {
        setForm(INITIAL_FORM);
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setUploadStatus("idle");
        setActiveTab("books");
      }, 1200);
    } catch (err) {
      console.error(err);
      setUploadStatus("error");
      setUploadError(err?.message || "Failed to save e-book. Please try again.");
    }
  };

  // ── Access Guard ──────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="admin-page page-enter" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div className="spinner large" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-page page-enter">
        <div className="container" style={{ maxWidth: "580px", margin: "60px auto" }}>
          <div className="glass" style={{ padding: "48px 32px", textAlign: "center", borderRadius: "24px" }}>
            <span style={{ fontSize: "3.5rem", display: "block", marginBottom: "1rem" }}>🔒</span>
            <h2 className="script" style={{ fontSize: "2.2rem", marginBottom: "0.6rem", color: "var(--pink)" }}>
              Admin Access Only
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.8rem", fontSize: "0.95rem", lineHeight: "1.6" }}>
              This page is restricted to administrators only.
            </p>
            <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/" className="btn btn-primary">
                ← Back to Home
              </Link>
              {!user && (
                <button className="btn btn-ghost" onClick={() => setAuthModalOpen(true)}>
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  // ── Stats Calculations ────────────────────────────────────
  const totalBooks = books.length;
  const totalPages = books.reduce((acc, b) => acc + (b.pageCount || 0), 0);
  const totalBytes = books.reduce((acc, b) => acc + (b.fileSize || 0), 0);
  const filteredBooks = books.filter((b) => {
    const q = searchQuery.toLowerCase();
    return !q || b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.category?.toLowerCase().includes(q);
  });

  return (
    <div className="admin-page page-enter">
      <div className="container admin__container">

        {/* ── Header ── */}
        <div className="admin__header">
          <div className="admin__title-wrap">
            <span className="admin__icon">⚡</span>
            <div>
              <h1 className="admin__title">
                <span className="script">Admin</span> Panel
              </h1>
              <p className="admin__sub">
                Logged in as <strong>{user?.email}</strong> <span className="navbar__admin-badge">👑 ADMIN</span>
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Link to="/" className="btn btn-ghost">View Public Library</Link>
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab("upload")}
            >
              + Upload E-Book
            </button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="admin__stats-grid">
          <div className="admin__stat-card glass">
            <span className="admin__stat-icon">📚</span>
            <div>
              <div className="admin__stat-val">{totalBooks}</div>
              <div className="admin__stat-lbl">Published Books</div>
            </div>
          </div>

          <div className="admin__stat-card glass">
            <span className="admin__stat-icon">📄</span>
            <div>
              <div className="admin__stat-val">{totalPages}</div>
              <div className="admin__stat-lbl">Total Pages</div>
            </div>
          </div>

          <div className="admin__stat-card glass">
            <span className="admin__stat-icon">📁</span>
            <div>
              <div className="admin__stat-val">{formatBytes(totalBytes)}</div>
              <div className="admin__stat-lbl">Cloud Storage</div>
            </div>
          </div>

          <div className="admin__stat-card glass">
            <span className="admin__stat-icon">🏷️</span>
            <div>
              <div className="admin__stat-val">{new Set(books.map((b) => b.category)).size}</div>
              <div className="admin__stat-lbl">Categories</div>
            </div>
          </div>
        </div>

        {/* ── Tabs Navigation ── */}
        <div className="admin__tabs">
          <button
            type="button"
            className={`admin__tab ${activeTab === "books" ? "active" : ""}`}
            onClick={() => setActiveTab("books")}
          >
            📚 Manage Books ({books.length})
          </button>
          <button
            type="button"
            className={`admin__tab ${activeTab === "upload" ? "active" : ""}`}
            onClick={() => setActiveTab("upload")}
          >
            ➕ Add New E-Book
          </button>
        </div>

        {/* ── TAB 1: MANAGE BOOKS ── */}
        {activeTab === "books" && (
          <div className="admin__table-card glass">
            <div className="admin__table-header">
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Book Library Management</h3>
              <input
                type="text"
                placeholder="Search title, author, category…"
                className="admin__search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loadingBooks ? (
              <div className="loading-box">
                <div className="spinner" />
                <p>Loading library records…</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                {books.length === 0 ? "No books uploaded yet. Click '+ Add New E-Book' to add one!" : "No books match your search filter."}
              </div>
            ) : (
              <div className="admin__table-wrap">
                <table className="admin__table">
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Link / Product</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.map((book) => (
                      <tr key={book.id}>
                        <td>
                          <div className="admin__book-cell">
                            {book.cover ? (
                              <img src={book.cover} alt="" className="admin__book-thumb" />
                            ) : (
                              <div className="admin__book-thumb-empty">📖</div>
                            )}
                            <div>
                              <span className="admin__book-title">{book.title}</span>
                              <span className="admin__book-author">{book.author || "Unknown Author"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="book-card__badge" style={{ position: "static", display: "inline-block" }}>
                            {book.category}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: "var(--pink)" }}>
                            {book.price ? `$${book.price}` : "Free"}
                          </strong>
                        </td>
                        <td>
                          {book.link ? (
                            <a
                              href={book.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "var(--pink)", fontSize: "0.85rem", textDecoration: "underline" }}
                            >
                              🔗 Gumroad Link
                            </a>
                          ) : (
                            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                              {book.pageCount ? `📄 ${book.pageCount} pages` : "No link"}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="admin__actions-cell">
                            {book.link ? (
                              <a
                                href={book.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin__action-btn admin__action-btn--read"
                                title="Open Gumroad Link"
                              >
                                🔗 Visit
                              </a>
                            ) : (
                              <Link to={`/read/${book.id}`} className="admin__action-btn admin__action-btn--read" title="Open in 3D Reader">
                                👁 Read
                              </Link>
                            )}
                            <Link to={`/edit/${book.id}`} className="admin__action-btn admin__action-btn--edit" title="Edit Metadata or Link">
                              ✏️ Edit
                            </Link>
                            <button
                              type="button"
                              className="admin__action-btn admin__action-btn--del"
                              onClick={() => handleDeleteBook(book.id)}
                              disabled={deletingId === book.id}
                              title="Delete Book"
                            >
                              {deletingId === book.id ? "…" : "🗑 Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: UPLOAD FORM ── */}
        {activeTab === "upload" && (
          <form className="upload__form glass" onSubmit={handleUploadSubmit}>
            <div style={{ marginBottom: "10px" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 700 }}>Upload New E-Book (Admin)</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Add your cover thumbnail and Gumroad checkout link. Users will be redirected directly to your link.
              </p>
            </div>

            {uploadError && <div className="upload__error">⚠️ {uploadError}</div>}
            {uploadSuccess && <div className="upload__success">{uploadSuccess}</div>}

            {/* Drop Zone (Thumbnail) */}
            <div
              className={`upload__dropzone${thumbnailPreview ? " has-file" : ""}${dragging ? " dragging" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onThumbnailDrop}
              onClick={() => !thumbnailPreview && document.getElementById("admin-thumb-input").click()}
            >
              <input
                id="admin-thumb-input"
                type="file"
                accept="image/*"
                hidden
                onChange={onThumbnailDrop}
              />
              {thumbnailPreview ? (
                <div className="upload__file-info">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    style={{
                      width: "60px",
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,107,156,0.4)",
                      flexShrink: 0,
                    }}
                  />
                  <div className="upload__file-details">
                    <p className="upload__file-name">{thumbnailFile?.name || "Thumbnail Image"}</p>
                    <p className="upload__file-size">{thumbnailFile ? formatBytes(thumbnailFile.size) : "Ready to upload"}</p>
                  </div>
                  <button
                    type="button"
                    className="upload__file-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      setThumbnailFile(null);
                      setThumbnailPreview(null);
                    }}
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <div className="upload__dropzone-icon">🖼️</div>
                  <p className="upload__dropzone-title">Drag & drop your Thumbnail image here</p>
                  <p className="upload__dropzone-sub">or click to browse from your computer (PNG, JPG, WEBP)</p>
                </>
              )}
            </div>

            {/* Metadata Fields */}
            <div className="upload__fields">
              <div className="upload__field upload__field--full">
                <label>Product / Gumroad Link *</label>
                <div className="upload__price-wrap">
                  <span className="upload__price-symbol">🔗</span>
                  <input
                    type="url"
                    value={form.link}
                    onChange={setField("link")}
                    placeholder="https://mayafit.gumroad.com/l/uylist"
                    className="upload__price-input"
                    disabled={uploadStatus === "processing"}
                    required
                  />
                </div>
              </div>

              <div className="upload__field">
                <label>Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={setField("title")}
                  placeholder="e.g. Maya's 30-Day Shred Guide"
                  disabled={uploadStatus === "processing"}
                  required
                />
              </div>

              <div className="upload__field">
                <label>Author</label>
                <input
                  type="text"
                  value={form.author}
                  onChange={setField("author")}
                  placeholder="e.g. Maya Fit"
                  disabled={uploadStatus === "processing"}
                />
              </div>

              <div className="upload__field">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={setField("category")}
                  disabled={uploadStatus === "processing"}
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="upload__field">
                <label>Price</label>
                <div className="upload__price-wrap">
                  <span className="upload__price-symbol">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={setField("price")}
                    placeholder="0.00 — leave blank if free"
                    className="upload__price-input"
                    disabled={uploadStatus === "processing"}
                  />
                </div>
              </div>

              <div className="upload__field upload__field--full">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={setField("description")}
                  rows={3}
                  placeholder="Short description of this e-book / guide…"
                  disabled={uploadStatus === "processing"}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="upload__actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploadStatus === "processing"}
              >
                {uploadStatus === "processing" ? (
                  <>
                    <span className="spinner spinner--sm" />
                    <span>Publishing ({uploadProgress}%)…</span>
                  </>
                ) : (
                  "✨ Publish to Store"
                )}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setForm(INITIAL_FORM);
                  setThumbnailFile(null);
                  setThumbnailPreview(null);
                  setUploadError("");
                }}
                disabled={uploadStatus === "processing"}
              >
                Reset
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

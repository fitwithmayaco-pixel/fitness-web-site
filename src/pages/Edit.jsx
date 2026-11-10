import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CATEGORIES } from "../config";
import { getBook, updateBook, deleteBook } from "../utils/db";
import { readFileAsDataURL, readFileAsArrayBuffer, formatBytes } from "../utils/helpers";
import { loadPDF } from "../utils/pdfUtils";
import "./Edit.css";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (Supabase Free Tier)

export default function EditBook() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [form, setForm] = useState({ title: "", author: "", category: "", description: "", price: "" });
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverChanged, setCoverChanged] = useState(false);
  const [newPdfFile, setNewPdfFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | saving | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Load existing book ──────────────────────────────────────
  useEffect(() => {
    getBook(id).then((b) => {
      if (!b) { setErrorMsg("Book not found."); return; }
      setBook(b);
      setForm({
        title: b.title || "",
        author: b.author || "",
        category: b.category || "Wellness",
        description: b.description || "",
        price: b.price || "",
      });
      setCoverPreview(b.cover || null);
    });
  }, [id]);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // ── Cover change ────────────────────────────────────────────
  const onCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const dataURL = await readFileAsDataURL(file);
    setCoverPreview(dataURL);
    setCoverChanged(true);
  };

  // ── Replace PDF ─────────────────────────────────────────────
  const onPdfChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg("Please select a valid PDF file.");
      return;
    }
    if (file.size === 0) {
      setErrorMsg("The selected replacement PDF is empty (0 bytes).");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg(`PDF is too large (${formatBytes(file.size)}). Supabase allows a max of 50 MB.`);
      return;
    }
    setErrorMsg("");
    setNewPdfFile(file);
  };

  // ── Save ────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setErrorMsg("Title cannot be empty."); return; }
    if (newPdfFile && newPdfFile.size > MAX_FILE_SIZE) {
      setErrorMsg(`Replacement PDF is too large (${formatBytes(newPdfFile.size)}). Max allowed is 50 MB.`);
      return;
    }
    setStatus("saving");
    setErrorMsg("");

    try {
      const updatePayload = {
        title: form.title.trim(),
        author: form.author.trim(),
        category: form.category,
        description: form.description.trim(),
        price: form.price.trim(),
        ...(coverChanged ? { cover: coverPreview } : {}),
      };

      // If a new replacement PDF was uploaded
      if (newPdfFile) {
        const arrayBuffer = await readFileAsArrayBuffer(newPdfFile);
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error("InvalidPDFException: Replacement PDF is empty (0 bytes).");
        }
        const pdfDoc = await loadPDF(arrayBuffer.slice(0));
        const pageCount = pdfDoc.numPages;
        if (pdfDoc._destroy) pdfDoc._destroy();

        updatePayload.pdfFile = newPdfFile;
        updatePayload.pdfData = arrayBuffer;
        updatePayload.pageCount = pageCount;
        updatePayload.fileSize = newPdfFile.size;
      }

      await updateBook(id, updatePayload);
      setStatus("done");
      setTimeout(() => navigate("/"), 900);
    } catch (err) {
      console.error("Edit save error:", err);
      setStatus("error");

      const rawMsg = err?.message || err?.error_description || String(err);
      let friendlyMsg = rawMsg;

      if (rawMsg.includes("exceeded the maximum allowed size") || rawMsg.includes("Payload Too Large")) {
        friendlyMsg = `The replacement PDF exceeds the 50 MB Supabase storage limit. Please compress it before saving.`;
      } else if (rawMsg.includes("InvalidPDFException") || rawMsg.includes("zero bytes") || rawMsg.includes("empty")) {
        friendlyMsg = "The replacement PDF file is empty or corrupted (0 bytes).";
      } else if (rawMsg.includes("Failed to fetch") || rawMsg.includes("NetworkError")) {
        friendlyMsg = "Network error connecting to Supabase. Please verify your connection.";
      }
      setErrorMsg(friendlyMsg);
    }
  };

  // ── Delete ──────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await deleteBook(id);
      navigate("/");
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to delete book.");
    }
  };

  // ── Error / Loading ─────────────────────────────────────────
  if (errorMsg && !book) {
    return (
      <div className="edit edit--error">
        <p>😕 {errorMsg}</p>
        <Link to="/" className="btn btn-primary">Back to Library</Link>
      </div>
    );
  }
  if (!book) {
    return <div className="edit edit--loading"><div className="spinner large" /><p>Loading…</p></div>;
  }

  return (
    <div className="edit page-enter">
      <div className="container edit__container">

        {/* Header */}
        <div className="edit__header">
          <Link to="/" className="edit__back">← Back to Library</Link>
          <h1 className="edit__title">
            <span className="script">Edit</span> Book
          </h1>
          <p className="edit__sub">Update details for <strong>"{book.title}"</strong></p>
        </div>

        <div className="edit__layout">

          {/* ── Cover & File sidebar ── */}
          <div className="edit__sidebar">
            <div className="edit__cover-card glass">
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" className="edit__cover-img" />
              ) : (
                <div className="edit__cover-placeholder">📖</div>
              )}
              <div className="edit__cover-actions">
                <label className="btn btn-outline edit__change-cover-btn">
                  🖼 Change Cover
                  <input type="file" accept="image/*" hidden onChange={onCoverChange} />
                </label>
                {coverChanged && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => { setCoverPreview(book.cover); setCoverChanged(false); }}
                  >
                    ↩ Revert
                  </button>
                )}
              </div>

              {/* Replace PDF */}
              <div style={{ marginTop: "12px", width: "100%", textAlign: "center" }}>
                <label className="btn btn-outline" style={{ width: "100%", fontSize: "0.85rem", cursor: "pointer" }}>
                  📁 {newPdfFile ? "✓ PDF Selected" : "Replace PDF File"}
                  <input type="file" accept="application/pdf" hidden onChange={onPdfChange} />
                </label>
                {newPdfFile && (
                  <p style={{ fontSize: "0.78rem", color: "var(--pink)", marginTop: "4px" }}>
                    New: {newPdfFile.name} ({(newPdfFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </p>
                )}
              </div>

              <div className="edit__book-meta" style={{ marginTop: "14px" }}>
                <span>📄 {book.pageCount} pages</span>
                <span>📁 {book.fileSize ? (book.fileSize / (1024 * 1024)).toFixed(1) : 0} MB</span>
              </div>
            </div>

            {/* Open in reader */}
            <Link to={`/read/${id}`} className="btn btn-primary edit__read-btn">📖 Open Reader</Link>
          </div>

          {/* ── Form ── */}
          <form className="edit__form glass" onSubmit={handleSave}>

            <div className="edit__fields">

              <div className="edit__field edit__field--full">
                <label>Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={setField("title")}
                  placeholder="Book title"
                  required
                />
              </div>

              <div className="edit__field">
                <label>Author</label>
                <input
                  type="text"
                  value={form.author}
                  onChange={setField("author")}
                  placeholder="Author name"
                />
              </div>

              <div className="edit__field">
                <label>Category</label>
                <select value={form.category} onChange={setField("category")}>
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="edit__field">
                <label>Price</label>
                <div className="edit__price-wrap">
                  <span className="edit__price-symbol">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={setField("price")}
                    placeholder="0.00  —  leave blank if free"
                    className="edit__price-input"
                  />
                </div>
              </div>

              <div className="edit__field edit__field--full">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={setField("description")}
                  rows={4}
                  placeholder="Short description of this book…"
                />
              </div>

            </div>

            {/* Status messages */}
            {errorMsg && <p className="edit__error">⚠️ {errorMsg}</p>}
            {status === "done" && <p className="edit__success">✅ Saved! Redirecting…</p>}

            {/* Actions */}
            <div className="edit__actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={status === "saving" || status === "done"}
              >
                {status === "saving" ? "Saving…" : "💾 Save Changes"}
              </button>
              <Link to="/" className="btn btn-ghost">Cancel</Link>

              {/* Delete */}
              <button
                type="button"
                className="btn edit__delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
              >
                🗑 Delete Book
              </button>
            </div>
          </form>
        </div>

        {/* ── Delete Confirm Dialog ── */}
        {showDeleteConfirm && (
          <div className="edit__overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="edit__dialog glass" onClick={(e) => e.stopPropagation()}>
              <h3>Delete <span className="script">"{book.title}"</span>?</h3>
              <p>This will permanently remove the book and all reading progress. This cannot be undone.</p>
              <div className="edit__dialog-actions">
                <button className="btn edit__confirm-delete" onClick={handleDelete}>
                  🗑 Yes, Delete
                </button>
                <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "../config";
import { saveBook } from "../utils/db";
import { generateCover, loadPDF } from "../utils/pdfUtils";
import { uid, formatBytes, readFileAsArrayBuffer, readFileAsDataURL } from "../utils/helpers";
import "./Upload.css";

const INITIAL_FORM = {
  title: "", author: "", category: "Wellness", description: "", price: "",
};

export default function Upload() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [pdfFile, setPdfFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | processing | done | error
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Form helpers ───────────────────────────────────
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // ── Drop zone ──────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files[0] || e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrorMsg("Please drop a PDF file.");
      return;
    }
    setPdfFile(file);
    setErrorMsg("");
    // Auto-fill title from filename
    if (!form.title) {
      const name = file.name.replace(/\.pdf$/i, "").replace(/[_-]/g, " ");
      setForm((f) => ({ ...f, title: name }));
    }
  }, [form.title]);

  const onCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    const dataURL = await readFileAsDataURL(file);
    setCoverPreview(dataURL);
  };

  // ── Submit ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) { setErrorMsg("Please select a PDF file."); return; }
    if (!form.title.trim()) { setErrorMsg("Please enter a title."); return; }

    try {
      setStatus("processing");
      setProgress(10);

      // Read PDF bytes
      const arrayBuffer = await readFileAsArrayBuffer(pdfFile);
      setProgress(30);

      // Get page count
      const pdf = await loadPDF(arrayBuffer.slice(0));
      const pageCount = pdf.numPages;
      pdf._destroy();   // safe cleanup (pdfjs-dist v4+ uses loadingTask.destroy)
      setProgress(55);

      // Cover
      let cover = coverPreview;
      if (!cover) {
        setProgress(60);
        cover = await generateCover(arrayBuffer.slice(0), 0.5);
      }
      setProgress(80);

      // Save
      const id = uid();
      await saveBook({
        id,
        title: form.title.trim(),
        author: form.author.trim(),
        category: form.category,
        description: form.description.trim(),
        price: form.price.trim(),
        cover,
        pageCount,
        fileSize: pdfFile.size,
        pdfData: arrayBuffer,  // stored as ArrayBuffer in IndexedDB
        createdAt: Date.now(),
      });

      setProgress(100);
      setStatus("done");
      setTimeout(() => navigate(`/read/${id}`), 1000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg("Failed to process PDF. Please try again.");
    }
  };

  const reset = () => {
    setForm(INITIAL_FORM);
    setPdfFile(null);
    setCoverFile(null);
    setCoverPreview(null);
    setStatus("idle");
    setProgress(0);
    setErrorMsg("");
  };

  return (
    <div className="upload page-enter">
      <div className="container upload__container">
        <div className="upload__header">
          <h1 className="upload__title">
            <span className="script">Upload</span> Your E-Book
          </h1>
          <p className="upload__sub">Add a PDF to your personal fitness library. It stays in your browser — no server needed.</p>
        </div>

        <form className="upload__form glass" onSubmit={handleSubmit}>
          {/* ── Drop Zone ── */}
          <div
            className={`upload__dropzone${pdfFile ? " has-file" : ""}${dragging ? " dragging" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !pdfFile && document.getElementById("pdf-input").click()}
          >
            <input
              id="pdf-input"
              type="file"
              accept="application/pdf"
              hidden
              onChange={onDrop}
            />
            {pdfFile ? (
              <div className="upload__file-info">
                <span className="upload__file-icon">📄</span>
                <div>
                  <p className="upload__file-name">{pdfFile.name}</p>
                  <p className="upload__file-size">{formatBytes(pdfFile.size)}</p>
                </div>
                <button type="button" className="upload__file-remove" onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}>✕</button>
              </div>
            ) : (
              <>
                <div className="upload__dropzone-icon">📚</div>
                <p className="upload__dropzone-title">Drag & drop your PDF here</p>
                <p className="upload__dropzone-sub">or click to browse — large files (50MB+) are OK</p>
              </>
            )}
          </div>

          {/* ── Fields ── */}
          <div className="upload__fields">
            <div className="upload__field">
              <label>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={setField("title")}
                placeholder="e.g. 30-Day Shred Guide"
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
              />
            </div>
            <div className="upload__field">
              <label>Category</label>
              <select value={form.category} onChange={setField("category")}>
                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="upload__field">
              <label>Price (optional)</label>
              <div className="upload__price-wrap">
                <span className="upload__price-symbol">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={setField("price")}
                  placeholder="0.00  —  leave blank if free"
                  className="upload__price-input"
                />
              </div>
            </div>
            <div className="upload__field upload__field--full">
              <label>Short Description</label>
              <textarea
                value={form.description}
                onChange={setField("description")}
                rows={3}
                placeholder="What is this book about?"
              />
            </div>

            {/* Cover image */}
            <div className="upload__field upload__field--cover">
              <label>Custom Cover (optional)</label>
              <div className="upload__cover-wrap">
                {coverPreview ? (
                  <div className="upload__cover-preview">
                    <img src={coverPreview} alt="Cover preview" />
                    <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null); }}>✕ Remove</button>
                  </div>
                ) : (
                  <label className="upload__cover-btn btn btn-ghost">
                    📷 Choose Cover Image
                    <input type="file" accept="image/*" hidden onChange={onCoverChange} />
                  </label>
                )}
                <p className="upload__cover-hint">Leave blank to auto-generate from PDF page 1</p>
              </div>
            </div>
          </div>

          {/* ── Error ── */}
          {errorMsg && <p className="upload__error">⚠️ {errorMsg}</p>}

          {/* ── Progress ── */}
          {status === "processing" && (
            <div className="upload__progress">
              <div className="upload__progress-track">
                <div className="upload__progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p>Processing… {progress}%</p>
            </div>
          )}
          {status === "done" && (
            <p className="upload__success">✅ Book added! Redirecting to reader…</p>
          )}

          {/* ── Actions ── */}
          <div className="upload__actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={status === "processing" || status === "done"}
            >
              {status === "processing" ? "Processing…" : "📖 Add to Library"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={reset}>Reset</button>
          </div>
        </form>
      </div>
    </div>
  );
}

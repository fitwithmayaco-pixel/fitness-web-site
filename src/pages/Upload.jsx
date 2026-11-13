import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CATEGORIES } from "../config";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import { saveBook } from "../utils/db";
import { uid, formatBytes, readFileAsDataURL } from "../utils/helpers";
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

export default function Upload() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | processing | done | error
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Form helpers ───────────────────────────────────
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // ── Thumbnail drop zone ────────────────────────────
  const onThumbnailDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files[0] || e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please drop or select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg(`Image size (${formatBytes(file.size)}) is too large. Max allowed is 20 MB.`);
      return;
    }

    setThumbnailFile(file);
    setErrorMsg("");
    const dataUrl = await readFileAsDataURL(file);
    setThumbnailPreview(dataUrl);

    // Auto-fill title from filename if title is empty
    if (!form.title) {
      const name = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setForm((f) => ({ ...f, title: name.charAt(0).toUpperCase() + name.slice(1) }));
    }
  }, [form.title]);

  // ── Submit ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setErrorMsg("Please enter a title."); return; }
    if (!form.link.trim()) { setErrorMsg("Please enter the Gumroad or product link."); return; }
    if (!thumbnailPreview && !thumbnailFile) {
      setErrorMsg("Please select or drop a thumbnail image for this e-book.");
      return;
    }

    try {
      setStatus("processing");
      setProgress(25);

      const id = uid();
      setProgress(60);

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

      setProgress(100);
      setStatus("done");
      setTimeout(() => navigate("/"), 900);
    } catch (err) {
      console.error("Upload process error:", err);
      setStatus("error");
      setErrorMsg(err?.message || "Failed to save e-book. Please try again.");
    }
  };

  const reset = () => {
    setForm(INITIAL_FORM);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setStatus("idle");
    setProgress(0);
    setErrorMsg("");
  };

  // ── Access Control: Admin Only ─────────────────────
  if (authLoading) {
    return (
      <div className="upload page-enter" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div className="spinner large" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="upload page-enter">
        <div className="container" style={{ maxWidth: "560px", margin: "60px auto" }}>
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
                ← Back to Library
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

  return (
    <div className="upload page-enter">
      <div className="container upload__container">
        <div className="upload__header">
          <div>
            <h1 className="upload__title">
              <span className="script">Upload</span> New E-Book
            </h1>
            <p className="upload__sub">Add a new workout guide thumbnail and product link to the FitWithMaya store.</p>
          </div>
          <Link to="/admin" className="btn btn-ghost" style={{ alignSelf: "center" }}>
            ⚡ Admin Panel
          </Link>
        </div>

        <form className="upload__form glass" onSubmit={handleSubmit}>
          {/* ── Drop Zone (Thumbnail Image) ── */}
          <div
            className={`upload__dropzone${thumbnailPreview ? " has-file" : ""}${dragging ? " dragging" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onThumbnailDrop}
            onClick={() => !thumbnailPreview && document.getElementById("thumbnail-input").click()}
          >
            <input
              id="thumbnail-input"
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
                <p className="upload__dropzone-sub">or click to browse from computer (PNG, JPG, WEBP)</p>
              </>
            )}
          </div>

          {/* ── Fields ── */}
          <div className="upload__fields">
            {/* Gumroad / Purchase Link */}
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
                  required
                  disabled={status === "processing"}
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
                required
                disabled={status === "processing"}
              />
            </div>

            <div className="upload__field">
              <label>Author</label>
              <input
                type="text"
                value={form.author}
                onChange={setField("author")}
                placeholder="e.g. Maya Fit"
                disabled={status === "processing"}
              />
            </div>

            <div className="upload__field">
              <label>Category</label>
              <select
                value={form.category}
                onChange={setField("category")}
                disabled={status === "processing"}
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
                  disabled={status === "processing"}
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
                disabled={status === "processing"}
              />
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
              <p>Publishing… {progress}%</p>
            </div>
          )}
          {status === "done" && (
            <p className="upload__success">✅ E-Book published! Redirecting to library…</p>
          )}

          {/* ── Actions ── */}
          <div className="upload__actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={status === "processing" || status === "done"}
            >
              {status === "processing" ? (
                <>
                  <span className="spinner spinner--sm" />
                  <span>Publishing ({progress}%)…</span>
                </>
              ) : status === "done" ? (
                "✓ Published!"
              ) : (
                "✨ Publish to Store"
              )}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={reset}
              disabled={status === "processing"}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

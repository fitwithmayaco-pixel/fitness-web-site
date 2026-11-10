import {
  useState, useEffect, useRef, useCallback, useMemo
} from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import HTMLFlipBook from "react-pageflip";
import { getBook, saveProgress, getProgress } from "../utils/db";
import { loadPDF, renderPageToDataURL } from "../utils/pdfUtils";
import { clamp } from "../utils/helpers";
import "./Reader.css";

// ── Page Component ─────────────────────────────────────────────
// react-pageflip needs forwardRef pages
import { forwardRef } from "react";
const FlipPage = forwardRef(function FlipPage({ src, pageNum, total, isBlank }, ref) {
  return (
    <div ref={ref} className="flip-page">
      {isBlank ? (
        <div className="flip-page__blank" />
      ) : src ? (
        <img src={src} alt={`Page ${pageNum}`} className="flip-page__img" draggable={false} />
      ) : (
        <div className="flip-page__loading">
          <div className="spinner" />
          <p>p.{pageNum}</p>
        </div>
      )}
      {!isBlank && (
        <span className="flip-page__num">{pageNum} / {total}</span>
      )}
    </div>
  );
});

// ── Main Reader ─────────────────────────────────────────────────
export default function Reader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const flipRef = useRef(null);

  const [book, setBook] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [pageImages, setPageImages] = useState({});          // { pageNum: dataURL }
  const [currentPage, setCurrentPage] = useState(0);        // 0-indexed flip-book page index
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [jumpInput, setJumpInput] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showControls, setShowControls] = useState(true);
  const controlTimer = useRef(null);

  // ── Load book + PDF ──────────────────────────────────────────
  useEffect(() => {
    let pdfDoc = null;
    (async () => {
      try {
        const b = await getBook(id);
        if (!b) { setError("Book not found."); return; }
        setBook(b);

        pdfDoc = await loadPDF(b.pdfUrl || b.pdfData);
        setPdf(pdfDoc);

        const count = pdfDoc.numPages;
        // For HTMLFlipBook we need even number of pages (add blank if odd)
        setTotalPages(count);

        // Restore progress
        const savedPage = await getProgress(id);
        // HTMLFlipBook page index: 0-based. For spreads, page index = floor(pdfPage / 2) * 2
        const flipIdx = isMobile ? savedPage : Math.floor(savedPage / 2) * 2;
        setCurrentPage(clamp(flipIdx, 0, count - 1));

        setLoading(false);
        // Pre-render first few pages
        renderRange(pdfDoc, 1, Math.min(4, count));
      } catch (e) {
        console.error("Reader error:", e);
        const msg = String(e?.message || e);
        if (msg.includes("empty") || msg.includes("zero bytes") || msg.includes("InvalidPDFException")) {
          setError(
            "The PDF file could not be loaded because it is empty (0 bytes) or the upload was interrupted. Please re-upload or edit this book."
          );
        } else if (msg.includes("404") || msg.includes("Failed to fetch") || msg.includes("400")) {
          setError(
            "Could not load the PDF from storage (400/404). Please ensure the file was uploaded completely to Supabase Storage."
          );
        } else {
          setError(e?.message || "Failed to open book.");
        }
      }
    })();
    return () => { if (pdfDoc?._destroy) pdfDoc._destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Render page range lazily ──────────────────────────────────
  const renderRange = useCallback(async (pdfDoc, from, to) => {
    for (let p = from; p <= to; p++) {
      setPageImages((prev) => {
        if (prev[p]) return prev;             // already rendered
        // kick off render
        renderPageToDataURL(pdfDoc, p, 1.5).then((url) => {
          setPageImages((prev2) => ({ ...prev2, [p]: url }));
        });
        return prev;
      });
    }
  }, []);

  // Pre-render nearby pages when currentPage changes
  useEffect(() => {
    if (!pdf) return;
    // Convert flip-book index → PDF page number (1-based)
    const pdfPage = currentPage + 1;
    const from = Math.max(1, pdfPage - 2);
    const to = Math.min(totalPages, pdfPage + 6);
    renderRange(pdf, from, to);
  }, [currentPage, pdf, totalPages, renderRange]);

  // ── Page change callback (from flip book) ────────────────────
  const onFlipChange = useCallback((e) => {
    const idx = e.data;
    setCurrentPage(idx);
    // PDF page = idx+1 for left page
    saveProgress(id, idx);
    resetControlTimer();
  }, [id]);

  // ── Programmatic navigation ───────────────────────────────────
  const goNext = () => { flipRef.current?.pageFlip().flipNext(); resetControlTimer(); };
  const goPrev = () => { flipRef.current?.pageFlip().flipPrev(); resetControlTimer(); };

  const jumpTo = (pdfPageNum) => {
    const p = clamp(pdfPageNum, 1, totalPages);
    const idx = isMobile ? p - 1 : Math.floor((p - 1) / 2) * 2;
    flipRef.current?.pageFlip().turnToPage(idx);
    setCurrentPage(idx);
    saveProgress(id, idx);
  };

  const handleJump = (e) => {
    e.preventDefault();
    const n = parseInt(jumpInput, 10);
    if (!isNaN(n)) { jumpTo(n); setJumpInput(""); }
  };

  // ── Keyboard ──────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   goPrev();
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ── Fullscreen ────────────────────────────────────────────────
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
      setFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setFullscreen(false);
    }
  };
  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ── Responsive ────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Auto-hide controls ────────────────────────────────────────
  const resetControlTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlTimer.current);
    controlTimer.current = setTimeout(() => setShowControls(false), 4000);
  }, []);
  useEffect(() => {
    resetControlTimer();
    return () => clearTimeout(controlTimer.current);
  }, [resetControlTimer]);

  // ── Build page list ───────────────────────────────────────────
  const pdfPageCount = totalPages;
  // Add blank page if needed for even spread
  const needsBlank = !isMobile && pdfPageCount % 2 !== 0;
  const pageNums = useMemo(() => {
    const arr = Array.from({ length: pdfPageCount }, (_, i) => i + 1);
    if (needsBlank) arr.push(null); // null = blank
    return arr;
  }, [pdfPageCount, needsBlank]);

  const displayPage = currentPage + 1; // human-readable

  // ── Flipbook dimensions ───────────────────────────────────────
  const pageW = isMobile ? Math.min(window.innerWidth - 32, 420) : 420;
  const pageH = Math.round(pageW * (297 / 210)); // A4 ratio

  // ── Render ────────────────────────────────────────────────────
  if (error) return (
    <div className="reader reader--error">
      <div className="reader__error-box glass">
        <p>😕 {error}</p>
        <Link to="/" className="btn btn-primary">Back to Library</Link>
      </div>
    </div>
  );

  if (loading) return (
    <div className="reader reader--loading">
      <div className="spinner large" />
      <p>Opening your book…</p>
    </div>
  );

  return (
    <div
      className={`reader${darkMode ? " dark" : " light"}${fullscreen ? " fullscreen" : ""}`}
      onMouseMove={resetControlTimer}
      onTouchStart={resetControlTimer}
    >
      {/* ── Top Bar ── */}
      <div className={`reader__topbar${showControls ? " visible" : ""}`}>
        <Link to="/" className="btn btn-ghost reader__back">← Library</Link>
        <div className="reader__book-title">
          <span className="script">{book?.title}</span>
        </div>
        <div className="reader__topbar-actions">
          <Link to={`/edit/${id}`} className="btn btn-ghost reader__edit-link" title="Edit Book">
            ✏️ Edit
          </Link>
          <button
            className={`reader__mode-btn${darkMode ? "" : " light-active"}`}
            onClick={() => setDarkMode((d) => !d)}
            title="Toggle reading mode"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button onClick={toggleFullscreen} title="Fullscreen (F)">
            {fullscreen ? "⛶" : "⛶"}
          </button>
        </div>
      </div>

      {/* ── Flip Book Stage ── */}
      <div
        className="reader__stage"
        style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
      >
        <HTMLFlipBook
          ref={flipRef}
          width={pageW}
          height={pageH}
          size="fixed"
          minWidth={280}
          maxWidth={600}
          minHeight={380}
          maxHeight={900}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={onFlipChange}
          startPage={currentPage}
          className="flip-book"
          flippingTime={700}
          usePortrait={isMobile}
          startZIndex={10}
          autoSize={false}
          maxShadowOpacity={0.6}
          drawShadow={true}
          useMouseEvents={true}
          swipeDistance={30}
        >
          {pageNums.map((pNum, idx) => (
            <FlipPage
              key={idx}
              src={pNum ? pageImages[pNum] : null}
              pageNum={pNum}
              total={pdfPageCount}
              isBlank={pNum === null}
            />
          ))}
        </HTMLFlipBook>
      </div>

      {/* ── Bottom Controls ── */}
      <div className={`reader__controls${showControls ? " visible" : ""}`}>
        {/* Prev */}
        <button className="reader__ctrl-btn" onClick={goPrev} title="Previous (←)">‹</button>

        {/* Page info + jump */}
        <form className="reader__jump" onSubmit={handleJump}>
          <span className="reader__page-info">{displayPage} / {pdfPageCount}</span>
          <input
            type="number"
            min={1}
            max={pdfPageCount}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            placeholder="Jump…"
            className="reader__jump-input"
            title="Jump to page"
          />
          <button type="submit" className="reader__jump-btn">Go</button>
        </form>

        {/* Zoom */}
        <div className="reader__zoom">
          <button onClick={() => setZoom((z) => clamp(z - 0.1, 0.5, 2))} title="Zoom out">−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => clamp(z + 0.1, 0.5, 2))} title="Zoom in">+</button>
        </div>

        {/* Next */}
        <button className="reader__ctrl-btn" onClick={goNext} title="Next (→)">›</button>
      </div>
    </div>
  );
}

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./BookCard.css";

export default function BookCard({ book, lastPage }) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const progress = lastPage && book.pageCount
    ? Math.round((lastPage / book.pageCount) * 100)
    : 0;

  const hasLink = Boolean(book.link && (book.link.startsWith("http://") || book.link.startsWith("https://")));
  const targetUrl = hasLink ? book.link : (book.pdfUrl ? `/read/${book.id}` : "#");

  const cardInner = (
    <>
      {/* Edit button - Only visible to Admin */}
      {isAdmin && (
        <button
          type="button"
          className="book-card__edit-btn"
          title="Edit Details (Admin Only)"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(`/edit/${book.id}`);
          }}
        >
          ✏️ Edit
        </button>
      )}

      {/* Cover / Thumbnail */}
      <div className="book-card__cover-wrap">
        {book.cover ? (
          <img src={book.cover} alt={book.title} className="book-card__cover" loading="lazy" />
        ) : (
          <div className="book-card__cover book-card__cover--placeholder">
            <span>📖</span>
          </div>
        )}
        {book.category && (
          <span className="book-card__badge">{book.category}</span>
        )}
        {/* Pink hover glow overlay */}
        <div className="book-card__hover-glow" />
      </div>

      {/* Info */}
      <div className="book-card__info">
        <h3 className="book-card__title">{book.title}</h3>
        <p className="book-card__author">{book.author || "Maya Fit"}</p>
        <p className="book-card__pages">
          {book.price ? (
            <span style={{ color: "var(--pink)", fontWeight: 700 }}>
              {book.price.startsWith("$") ? book.price : `$${book.price}`}
            </span>
          ) : hasLink ? (
            <span style={{ color: "var(--pink)", fontWeight: 600 }}>Get Guide ↗</span>
          ) : (
            <span>{book.pageCount ? `${book.pageCount} pages` : "Digital E-Book"}</span>
          )}
        </p>

        {/* Progress bar */}
        {progress > 0 && (
          <div className="book-card__progress">
            <div className="book-card__progress-bar">
              <div className="book-card__progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span>{progress}% read</span>
          </div>
        )}
      </div>
    </>
  );

  if (hasLink) {
    return (
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="book-card glass"
        title={`${book.title} (Opens on Gumroad)`}
      >
        {cardInner}
      </a>
    );
  }

  return (
    <Link to={targetUrl} className="book-card glass" title={book.title}>
      {cardInner}
    </Link>
  );
}

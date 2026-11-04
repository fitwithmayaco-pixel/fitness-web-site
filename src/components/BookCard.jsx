import { Link } from "react-router-dom";
import "./BookCard.css";

export default function BookCard({ book, lastPage }) {
  const progress = lastPage && book.pageCount
    ? Math.round((lastPage / book.pageCount) * 100)
    : 0;

  return (
    <Link to={`/read/${book.id}`} className="book-card glass" title={book.title}>
      {/* Cover */}
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
        <p className="book-card__author">{book.author || "Unknown Author"}</p>
        <p className="book-card__pages">{book.pageCount} pages</p>

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
    </Link>
  );
}

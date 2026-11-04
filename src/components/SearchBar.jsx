import { CATEGORIES } from "../config";
import "./SearchBar.css";

export default function SearchBar({ query, onQuery, category, onCategory }) {
  return (
    <div className="searchbar">
      {/* Search input */}
      <div className="searchbar__input-wrap">
        <span className="searchbar__icon">🔍</span>
        <input
          type="text"
          placeholder="Search books by title, author…"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          className="searchbar__input"
        />
        {query && (
          <button className="searchbar__clear" onClick={() => onQuery("")} aria-label="Clear">✕</button>
        )}
      </div>

      {/* Category chips */}
      <div className="searchbar__chips">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`searchbar__chip${category === cat ? " active" : ""}`}
            onClick={() => onCategory(cat === category ? "All" : cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

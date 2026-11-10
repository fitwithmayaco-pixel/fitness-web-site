import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import HeroBanner from "../components/HeroBanner";
import BookCard from "../components/BookCard";
import SearchBar from "../components/SearchBar";
import DailyTimer from "../components/DailyTimer";
import { getAllBooks } from "../utils/db";
import { getAllProgress } from "../utils/db";
import poster1 from "../assets/posters/poster1.jpg";
import "./Home.css";

export default function Home() {
  const [books, setBooks] = useState([]);
  const [progress, setProgress] = useState({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getAllBooks(), getAllProgress()])
      .then(([b, p]) => {
        setBooks(b || []);
        setProgress(p || {});
      })
      .catch((err) => {
        console.error("Failed to load books:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter books
  const filtered = books.filter((b) => {
    const q = query.toLowerCase();
    const matchQ = !q || b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q);
    const matchC = category === "All" || b.category === category;
    return matchQ && matchC;
  });

  // "Continue reading" = books with progress > 0
  const continueReading = books.filter((b) => progress[b.id] > 0);

  return (
    <div className="home page-enter">
      <HeroBanner />

      {/* ── 24-Hour Challenge Timer ──────────── */}
      <div className="container" style={{ marginTop: "2rem" }}>
        <DailyTimer />
      </div>

      {/* ── Continue Reading ─────────────────── */}
      {continueReading.length > 0 && (
        <section className="section home__section" id="continue">
          <div className="container">
            <h2 className="home__heading">
              <span className="script">Continue</span> Reading
            </h2>
            <div className="home__grid home__grid--wide">
              {continueReading.slice(0, 4).map((book) => (
                <BookCard key={book.id} book={book} lastPage={progress[book.id]} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Library ──────────────────────────── */}
      <section className="section home__section" id="library">
        <div className="container">
          <div className="home__library-header">
            <div>
              <h2 className="home__heading">
                <span className="script">My</span> Library
              </h2>
              <p className="home__sub">{books.length} book{books.length !== 1 ? "s" : ""} in your collection</p>
            </div>
            <Link to="/upload" className="btn btn-primary">+ Upload Book</Link>
          </div>

          <SearchBar
            query={query}
            onQuery={setQuery}
            category={category}
            onCategory={setCategory}
          />

          {/* Grid / Loading / Empty */}
          {loading ? (
            <div className="loading-box glass" style={{ margin: "40px auto", maxWidth: "420px" }}>
              <div className="spinner large" />
              <p style={{ color: "var(--white)", fontWeight: 500, fontSize: "1.05rem" }}>
                Loading your library…
              </p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="home__grid">
              {filtered.map((book) => (
                <BookCard key={book.id} book={book} lastPage={progress[book.id]} />
              ))}
            </div>
          ) : books.length === 0 ? (
            /* Empty state */
            <div className="home__empty">
              <img src={poster1} alt="Upload your first book" className="home__empty-img" />
              <div className="home__empty-text">
                <h3 className="script">No books yet!</h3>
                <p>Upload your first PDF e-book and start reading in style.</p>
                <Link to="/upload" className="btn btn-primary">Upload Now</Link>
              </div>
            </div>
          ) : (
            <div className="home__no-results">
              <p>No books match your search. Try a different keyword or category.</p>
              <button className="btn btn-ghost" onClick={() => { setQuery(""); setCategory("All"); }}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Poster mid-section ───────────────── */}
      <section className="home__poster-strip">
        <div className="home__poster-strip-overlay" />
        <div className="container home__poster-strip-content">
          <p className="script home__poster-strip-text">Train smart. Get stronger. Keep showing up. ♡</p>
          <Link to="/upload" className="btn btn-primary">Start Your Collection</Link>
        </div>
      </section>
    </div>
  );
}

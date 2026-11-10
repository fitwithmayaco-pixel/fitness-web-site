import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import HeroBanner from "../components/HeroBanner";
import BookCard from "../components/BookCard";
import SearchBar from "../components/SearchBar";
import DailyTimer from "../components/DailyTimer";
import { useAuth } from "../context/AuthContext";
import { getAllBooks, getAllProgress } from "../utils/db";
import mayaPurple from "../assets/posters/maya-gym-purple.jpg";
import "./Home.css";

export default function Home() {
  const { isAdmin } = useAuth();
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
                <span className="script">Fitness</span> Library
              </h2>
              <p className="home__sub">{books.length} book{books.length !== 1 ? "s" : ""} in collection</p>
            </div>
            {isAdmin && (
              <Link to="/admin" className="btn btn-primary">⚡ Admin Panel</Link>
            )}
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
              <img src={mayaPurple} alt="Maya Fitness Library" className="home__empty-img" />
              <div className="home__empty-text">
                <h3 className="script">No books yet!</h3>
                <p>Welcome to FitWithMaya! Get ready to explore workout programs and meal plans.</p>
                {isAdmin ? (
                  <Link to="/admin" className="btn btn-primary">⚡ Go to Admin Panel</Link>
                ) : (
                  <p style={{ color: "var(--pink)", fontSize: "0.95rem" }}>
                    Books will appear here once published by Maya.
                  </p>
                )}
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

      {/* ── Video Poster mid-section ───────────────── */}
      <section className="home__poster-strip">
        <video
          src="/videos/workout-bg2.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="home__poster-strip-video"
          aria-hidden="true"
        />
        <div className="home__poster-strip-overlay" />
        <div className="container home__poster-strip-content">
          <p className="script home__poster-strip-text">
            Train smart. Get stronger. Keep showing up. ♡
          </p>
          <a href="#library" className="btn btn-primary">Browse All Books</a>
        </div>
      </section>
    </div>
  );
}

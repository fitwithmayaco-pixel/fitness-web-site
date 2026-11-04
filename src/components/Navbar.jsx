import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { SITE } from "../config";
import "./Navbar.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [loc.pathname]);

  return (
    <nav className={`navbar${scrolled ? " navbar--scrolled" : ""}`}>
      <div className="container navbar__inner">
        {/* Brand */}
        <Link to="/" className="navbar__brand">
          <span className="navbar__icon">🏋️‍♀️</span>
          <span className="navbar__name script">{SITE.name}</span>
        </Link>

        {/* Desktop links */}
        <ul className="navbar__links">
          <li><Link to="/" className={loc.pathname === "/" ? "active" : ""}>Home</Link></li>
          <li><Link to="/upload" className={loc.pathname === "/upload" ? "active" : ""}>Upload</Link></li>
        </ul>

        {/* CTA */}
        <Link to="/upload" className="btn btn-primary navbar__cta">+ Add Book</Link>

        {/* Hamburger */}
        <button
          className={`navbar__hamburger${menuOpen ? " open" : ""}`}
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((p) => !p)}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`navbar__mobile${menuOpen ? " open" : ""}`}>
        <Link to="/">Home</Link>
        <Link to="/upload">Upload Books</Link>
      </div>
    </nav>
  );
}

import { Link } from "react-router-dom";
import { SITE, SOCIAL } from "../config";
import { useAuth } from "../context/AuthContext";
import "./Footer.css";

export default function Footer() {
  const { isAdmin } = useAuth();

  return (
    <footer className="footer">
      {/* Banner strip */}
      <div className="footer__banner">
        <div className="container footer__banner-inner">
          <div>
            <p className="footer__banner-script script">Keep showing up.</p>
            <p className="footer__banner-sub">Your journey starts with one page.</p>
          </div>
          {isAdmin ? (
            <Link to="/admin" className="btn btn-primary">⚡ Admin Panel</Link>
          ) : (
            <a href="#library" className="btn btn-primary">Explore Library</a>
          )}
        </div>
      </div>

      {/* Main footer */}
      <div className="container footer__main">
        <div className="footer__brand">
          <span className="footer__icon">🏋️‍♀️</span>
          <span className="script footer__name">{SITE.name}</span>
          <p className="footer__tagline">{SITE.tagline}</p>
        </div>

        <div className="footer__links">
          <h4>Navigation</h4>
          <Link to="/">Home</Link>
          <a href="#library">Fitness Library</a>
          {isAdmin && <Link to="/admin">⚡ Admin Panel</Link>}
        </div>

        <div className="footer__social">
          <h4>Follow Maya</h4>
          <div className="footer__social-icons">
            {SOCIAL.map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" title={s.label}>
                <span>{s.icon}</span>
              </a>
            ))}
          </div>
          <p className="footer__handle">@FitWithMaya</p>
        </div>
      </div>

      <div className="footer__copy">
        <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved. Made with 💗</p>
      </div>
    </footer>
  );
}

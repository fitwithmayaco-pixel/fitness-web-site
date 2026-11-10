import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { SITE } from "../config";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";
import "./Navbar.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, signOut, isAdmin } = useAuth();
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [loc.pathname]);

  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <>
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
            {isAdmin && (
              <li>
                <Link to="/admin" className={loc.pathname.startsWith("/admin") ? "active" : ""}>
                  ⚡ Admin Panel
                </Link>
              </li>
            )}
          </ul>

          {/* Auth Area & Actions */}
          <div className="navbar__auth-area">
            {user ? (
              <div className="navbar__user">
                {userAvatar ? (
                  <img src={userAvatar} alt={userName} className="navbar__avatar" />
                ) : (
                  <div className="navbar__avatar">{userName.charAt(0).toUpperCase()}</div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="navbar__user-name" title={user.email}>{userName}</span>
                    {isAdmin && <span className="navbar__admin-badge">👑 Admin</span>}
                  </div>
                </div>
                <button className="navbar__signout-btn" onClick={signOut} title="Sign Out">
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                className="navbar__login-btn"
                onClick={() => setAuthModalOpen(true)}
              >
                Sign In
              </button>
            )}

            {/* CTA - For Admin show Admin Panel button */}
            {isAdmin && (
              <Link to="/admin" className="btn btn-primary navbar__cta">⚡ Admin Panel</Link>
            )}
          </div>

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
          {isAdmin && <Link to="/admin">⚡ Admin Panel (Upload & Manage)</Link>}
          {user ? (
            <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#fff", fontSize: "0.9rem" }}>👤 {userName}</span>
                {isAdmin && <span className="navbar__admin-badge">👑 Admin</span>}
              </div>
              <button
                className="navbar__signout-btn"
                onClick={() => { signOut(); setMenuOpen(false); }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              style={{
                textAlign: "left",
                padding: "14px 20px",
                background: "none",
                border: "none",
                color: "var(--pink)",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
              onClick={() => { setAuthModalOpen(true); setMenuOpen(false); }}
            >
              🔑 Sign In / Register
            </button>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}

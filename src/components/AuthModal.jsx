import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./AuthModal.css";

export default function AuthModal({ isOpen, onClose }) {
  const { signInWithEmail, signUpWithEmail, isConfigured } = useAuth();
  const [tab, setTab] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (tab === "signup") {
        await signUpWithEmail(email, password, fullName);
        setSuccessMsg("Account created successfully! You can now sign in.");
        setTimeout(() => {
          setTab("login");
          setSuccessMsg("");
        }, 1500);
      } else {
        await signInWithEmail(email, password);
        onClose();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal glass" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="auth-modal__header">
          <span className="auth-modal__icon">🏋️‍♀️</span>
          <h2 className="auth-modal__title script">
            {tab === "login" ? "Welcome Back" : "Join FitWithMaya"}
          </h2>
          <p className="auth-modal__sub">
            {tab === "login"
              ? "Sign in to access your personal fitness library"
              : "Create an account to save reading progress"}
          </p>
        </div>

        {!isConfigured && (
          <div className="auth-error">
            ⚠️ <strong>Supabase Not Connected:</strong> Please set <code>VITE_SUPABASE_URL</code> and{" "}
            <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> file.
          </div>
        )}

        {errorMsg && <div className="auth-error">{errorMsg}</div>}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        {/* Tab switch */}
        <div className="auth-modal__tabs">
          <button
            type="button"
            className={`auth-modal__tab ${tab === "login" ? "active" : ""}`}
            onClick={() => { setTab("login"); setErrorMsg(""); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-modal__tab ${tab === "signup" ? "active" : ""}`}
            onClick={() => { setTab("signup"); setErrorMsg(""); }}
          >
            Create Account
          </button>
        </div>

        {/* Email / Password Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {tab === "signup" && (
            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Your Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                <span className="spinner spinner--sm" />
                <span>{tab === "login" ? "Signing In…" : "Creating Account…"}</span>
              </span>
            ) : tab === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

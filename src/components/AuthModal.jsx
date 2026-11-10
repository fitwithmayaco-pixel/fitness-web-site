import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./AuthModal.css";

export default function AuthModal({ isOpen, onClose }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isConfigured } = useAuth();
  const [tab, setTab] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [authAction, setAuthAction] = useState(null); // 'google' | 'email' | null
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setLoading(true);
    setAuthAction("google");
    try {
      await signInWithGoogle();
      // Browser redirects to Google login
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to sign in with Google.");
      setLoading(false);
      setAuthAction(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    setAuthAction("email");

    try {
      if (tab === "signup") {
        await signUpWithEmail(email, password, fullName);
        setSuccessMsg("Account created! Check your email for confirmation or sign in.");
        setTimeout(() => {
          setTab("login");
          setSuccessMsg("");
        }, 2000);
      } else {
        await signInWithEmail(email, password);
        onClose();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
      setAuthAction(null);
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
              ? "Sign in to sync your library across devices"
              : "Create an account to save your favorite books"}
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

        {/* Google OAuth Button */}
        <button
          type="button"
          className="btn-google"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          {loading && authAction === "google" ? (
            <>
              <span className="spinner spinner--sm spinner--dark" />
              <span>Connecting to Google…</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="auth-modal__divider">
          <span>or continue with email</span>
        </div>

        {/* Email / Password Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {tab === "signup" && (
            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Maya Fitness"
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
            {loading && authAction === "email" ? (
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

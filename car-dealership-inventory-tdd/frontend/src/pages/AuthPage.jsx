import { useState } from "react";
import {
  ArrowRight,
  CarFront,
  Check,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../services/api.js";

export default function AuthPage({ mode }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/vehicles" replace />;
  const joining = mode === "register";

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await (joining
        ? register(form)
        : login({ email: form.email, password: form.password }));
      navigate(result.user.role === "ADMIN" ? "/admin" : "/vehicles", {
        replace: true,
      });
    } catch (issue) {
      setError(errorMessage(issue));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-hero">
        <div className="auth-hero-content">
          <div className="brand brand-light">
            <span className="brand-mark">
              <CarFront size={23} />
            </span>
            TORQUE<span className="brand-dot">.</span>
          </div>
          <div className="auth-hero-copy">
            <span className="hero-kicker">
              <Sparkles size={15} /> A BETTER WAY TO DRIVE
            </span>
            <h1>
              Find the drive
              <br />
              that feels like <em>you.</em>
            </h1>
            <p>
              Discover exceptional cars, transparent prices, and a simpler path
              to your next adventure.
            </p>
          </div>
          <div className="auth-features">
            <span>
              <Check size={16} /> Handpicked selection
            </span>
            <span>
              <Check size={16} /> Simple, secure shopping
            </span>
          </div>
          <div className="hero-car">
            <CarFront size={240} strokeWidth={0.7} />
          </div>
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-panel">
          <span className="eyebrow">WELCOME TO TORQUE</span>
          <h2>{joining ? "Create your account" : "Welcome back"}</h2>
          <p className="auth-subtitle">
            {joining
              ? "Join us to find your next ride."
              : "Sign in to explore your next ride."}
          </p>
          <form onSubmit={submit} className="auth-form">
            {joining && (
              <label>
                Full name
                <input
                  autoComplete="name"
                  required
                  minLength="1"
                  maxLength="100"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete={joining ? "new-password" : "current-password"}
                required
                minLength="8"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 8 characters"
              />
            </label>
            {error && (
              <p className="alert alert-error" role="alert">
                {error}
              </p>
            )}
            <button disabled={busy} className="btn btn-accent auth-submit">
              {busy ? "Please wait…" : joining ? "Create account" : "Sign in"}{" "}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="auth-switch">
            {joining ? "Already have an account?" : "New to Torque?"}{" "}
            <Link to={joining ? "/login" : "/register"}>
              {joining ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <p className="auth-trust">
            <LockKeyhole size={14} /> Your account is protected with secure
            authentication
          </p>
        </div>
        <div className="auth-bottom">
          <ShieldCheck size={16} /> Your journey, in good hands.
        </div>
      </main>
    </div>
  );
}

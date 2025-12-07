// client/src/pages/LoginPage.tsx
import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:4000/auth/login", {
        email,
        password,
      });
      login(res.data.token, res.data.user);
      nav("/dashboard");
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at top, #4f46e5 0, #020617 55%)",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          borderRadius: 16,
          padding: 24,
          background: "rgba(15,23,42,0.94)",
          border: "1px solid rgba(148,163,184,0.4)",
          color: "#e5e7eb",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 6 }}>Sign in to OTDocs</h2>
        <p style={{ marginTop: 0, marginBottom: 18, color: "#9ca3af" }}>
          Use any test credentials you configured on the backend.
        </p>

        {error && (
          <div
            style={{
              marginBottom: 12,
              padding: 8,
              borderRadius: 8,
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(248,113,113,0.5)",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
          <label style={{ fontSize: 13 }}>
            Email
            <input
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                marginTop: 4,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #4b5563",
                background: "rgba(15,23,42,0.9)",
                color: "#e5e7eb",
              }}
            />
          </label>

          <label style={{ fontSize: 13 }}>
            Password
            <input
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                marginTop: 4,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #4b5563",
                background: "rgba(15,23,42,0.9)",
                color: "#e5e7eb",
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", marginTop: 4, textAlign: "center" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "#9ca3af",
            textAlign: "center",
          }}
        >
          <Link to="/" style={{ color: "#c4b5fd" }}>
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

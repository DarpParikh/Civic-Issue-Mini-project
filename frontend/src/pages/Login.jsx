import { useState } from "react";
import "../styles.css";

export default function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 1000));
    onLogin({ email, name: email.split("@")[0] });
    setLoading(false);
  };

  return (
    <div className="page-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "24px" }}>
      <div className="bg-mesh" />
      <div className="bg-grid" />
      <div className="chakra-bg" />

      {/* Left brand panel */}
      <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: "42%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px", background: "linear-gradient(160deg, rgba(255,107,0,0.08) 0%, rgba(19,136,8,0.05) 100%)", borderRight: "1px solid rgba(255,255,255,0.05)", zIndex: 1 }} className="hidden-mobile">
        <div style={{ marginBottom: 40 }}>
          <div className="tricolor-dot" style={{ width: 60, height: 60, marginBottom: 24, boxShadow: "0 0 30px rgba(255,107,0,0.4)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}>
            Civic<br />
            <span style={{ color: "var(--saffron)" }}>Voice</span>
          </h1>
          <p style={{ color: "var(--white-50)", fontSize: 16, lineHeight: 1.7, maxWidth: 320 }}>
            AI-powered platform for citizens to report and resolve civic issues across India.
          </p>
        </div>

        <div className="flag-stripe" style={{ width: 80, marginBottom: 40 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            { icon: "🤖", title: "AI-Powered Routing", desc: "Smart categorization & auto-routing to authorities" },
            { icon: "📍", title: "Location Intelligence", desc: "Real-time geolocation for precise issue reporting" },
            { icon: "✉️", title: "Auto Email Drafting", desc: "AI generates official complaint letters instantly" },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--white-05)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: "var(--white-50)", lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "auto", paddingTop: 40 }}>
          <div style={{ fontSize: 11, color: "var(--white-30, rgba(255,255,255,0.3))", letterSpacing: 1, textTransform: "uppercase" }}>
            भारत सरकार · Government of India
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div style={{ marginLeft: "42%", width: "58%", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", zIndex: 2, position: "relative" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div className="card stagger-1" style={{ padding: "40px 36px" }}>
            {/* Logo */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "conic-gradient(var(--saffron) 0deg 120deg, white 120deg 240deg, var(--india-green) 240deg 360deg)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--navy-mid)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⚖️</div>
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Welcome Back</h2>
              <p style={{ color: "var(--white-50)", fontSize: 14 }}>Sign in to your citizen portal</p>
            </div>

            <div className="flag-stripe" style={{ marginBottom: 28 }} />

            {error && (
              <div style={{ background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ff7777", marginBottom: 20 }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handle}>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <div className="input-icon-wrap">
                  <span className="icon">📧</span>
                  <input className="input-field" type="email" placeholder="citizen@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <div className="input-icon-wrap" style={{ position: "relative" }}>
                  <span className="icon">🔒</span>
                  <input className="input-field" type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 46 }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--white-50)" }}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <><span className="spinner" /> Signing in...</> : <>🔐 Sign In to Portal</>}
              </button>
            </form>

            <div className="divider">or</div>

            <button className="btn btn-secondary btn-full" onClick={onRegister}>
              📝 Register as New Citizen
            </button>

            <div style={{ marginTop: 20, textAlign: "center" }}>
              <span className="badge badge-green">🔒 Secure · Verified Portal</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          div[style*="margin-left: 42%"] { margin-left: 0 !important; width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

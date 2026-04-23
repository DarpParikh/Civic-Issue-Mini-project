import { useState } from "react";
import "../styles.css";

export default function Register({ onBack, onSuccess }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handle = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError("Please fill required fields"); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 1200));
    onSuccess();
  };

  return (
    <div className="page-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "24px" }}>
      <div className="bg-mesh" />
      <div className="bg-grid" />

      <div style={{ width: "100%", maxWidth: 480, zIndex: 1 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 20 }}>← Back to Login</button>

        <div className="card animate-in" style={{ padding: "40px 36px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏛️</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Register as Citizen</h2>
            <p style={{ color: "var(--white-50)", fontSize: 14 }}>Join the civic engagement platform</p>
          </div>

          <div className="flag-stripe" style={{ marginBottom: 28 }} />

          {error && (
            <div style={{ background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ff7777", marginBottom: 20 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handle}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                <label className="input-label">Full Name *</label>
                <div className="input-icon-wrap">
                  <span className="icon">👤</span>
                  <input className="input-field" type="text" placeholder="Your full name" value={form.name} onChange={e => set("name", e.target.value)} />
                </div>
              </div>

              <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                <label className="input-label">Email Address *</label>
                <div className="input-icon-wrap">
                  <span className="icon">📧</span>
                  <input className="input-field" type="email" placeholder="citizen@example.com" value={form.email} onChange={e => set("email", e.target.value)} />
                </div>
              </div>

              <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                <label className="input-label">Phone Number</label>
                <div className="input-icon-wrap">
                  <span className="icon">📱</span>
                  <input className="input-field" type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => set("phone", e.target.value)} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Password *</label>
                <input className="input-field" type="password" placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)} />
              </div>

              <div className="input-group">
                <label className="input-label">Confirm Password *</label>
                <input className="input-field" type="password" placeholder="••••••••" value={form.confirm} onChange={e => set("confirm", e.target.value)} />
              </div>
            </div>

            <div style={{ background: "var(--white-05)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "var(--white-50)", marginBottom: 20 }}>
              🛡️ Your data is protected under Government of India's data privacy standards.
            </div>

            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Creating Account...</> : <>✅ Create Citizen Account</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

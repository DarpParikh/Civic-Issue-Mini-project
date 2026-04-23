import { useCallback, useEffect, useMemo, useState } from "react";
import { getComplaints, updateStatus } from "../api";
import "../styles.css";

const STATUS_COLOR = {
  PENDING: "badge-orange",
  IN_PROGRESS: "badge-blue",
  RESOLVED: "badge-green",
  REJECTED: "badge-gold",
};

const CATEGORY_ICONS = {
  garbage: "🗑️", water: "💧", road: "🛣️", electricity: "⚡",
  streetlight: "💡", sewage: "🚽", noise: "🔊", encroachment: "🏗️",
  strayanimals: "🐕", airpollution: "🌫️", treefalling: "🌳", other: "📌",
};

const FILTERS = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Resolved", value: "RESOLVED" },
];

const normalizeStatus = (status) => {
  if (!status) return "PENDING";
  return String(status).trim().toUpperCase().replace(/\s+/g, "_");
};

const formatStatusLabel = (status) => {
  if (status === "IN_PROGRESS") return "In Progress";
  if (status === "RESOLVED") return "Resolved";
  if (status === "PENDING") return "Pending";
  if (status === "REJECTED") return "Rejected";
  return status || "Pending";
};

const formatComplaintDate = (complaint) => {
  if (complaint?.createdAt) {
    return new Date(complaint.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return complaint?.date || "N/A";
};

export default function Dashboard({ user, onCreateComplaint, onLogout }) {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchComplaints = useCallback(async () => {
    if (!user?.email) {
      setComplaints([]);
      return;
    }

    try {
      const data = await getComplaints(user.email);
      const complaintList = Array.isArray(data) ? data : [];
      console.log("[Dashboard] API response:", complaintList);
      setComplaints(complaintList);
    } catch (error) {
      console.error("[Dashboard] Failed to fetch complaints:", error);
      setComplaints([]);
    }
  }, [user?.email]);

  const handleStatusUpdate = useCallback(async (id, status) => {
    const normalizedStatus = normalizeStatus(status);
    setUpdatingId(id);

    // Instant UI response before backend roundtrip completes.
    setComplaints((prev) => prev.map((complaint) => (
      complaint.id === id ? { ...complaint, status: normalizedStatus } : complaint
    )));

    try {
      await updateStatus(id, normalizedStatus);
      await fetchComplaints();
    } catch (error) {
      console.error("[Dashboard] Failed to update complaint status:", error);
      await fetchComplaints();
    } finally {
      setUpdatingId(null);
    }
  }, [fetchComplaints]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const filteredComplaints = useMemo(() => {
    if (filter === "ALL") return complaints;
    return complaints.filter((complaint) => normalizeStatus(complaint.status) === filter);
  }, [complaints, filter]);

  useEffect(() => {
    console.log("[Dashboard] filteredComplaints:", filteredComplaints);
  }, [filteredComplaints]);

  const stats = [
    { label: "Total Filed",  value: complaints.length,                                          icon: "📋", color: "var(--saffron)" },
    { label: "Resolved",     value: complaints.filter(c => normalizeStatus(c.status) === "RESOLVED").length,     icon: "✅", color: "#00CC88" },
    { label: "In Progress",  value: complaints.filter(c => normalizeStatus(c.status) === "IN_PROGRESS").length,  icon: "🔄", color: "#7eb8ff" },
    { label: "Pending",      value: complaints.filter(c => normalizeStatus(c.status) === "PENDING").length,      icon: "⏳", color: "var(--gold-light)" },
  ];

  return (
    <div className="page-container">
      <div className="bg-mesh" />
      <div className="bg-grid" />

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,15,46,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "conic-gradient(var(--saffron) 0deg 120deg, white 120deg 240deg, var(--india-green) 240deg 360deg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--navy-mid)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>⚖️</div>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-display)" }}>Civic<span style={{ color: "var(--saffron)" }}>Voice</span></div>
              <div style={{ fontSize: 10, color: "var(--white-50)", letterSpacing: 0.5 }}>Government Portal</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: "var(--white-05)", border: "1px solid var(--border)" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--saffron), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                {(user?.name || "U")[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 13, color: "var(--white-80)" }}>{user?.name || "Citizen"}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onLogout}>🚪 Logout</button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px", position: "relative", zIndex: 1 }}>

        {/* Hero */}
        <div className="card card-glow stagger-1" style={{ padding: "36px 40px", marginBottom: 28, background: "linear-gradient(135deg, rgba(255,107,0,0.08) 0%, rgba(19,136,8,0.06) 50%, rgba(10,15,46,0.9) 100%)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,0,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <div>
              <div className="section-tag" style={{ marginBottom: 10 }}>🇮🇳 Secure & Verified</div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
                Welcome back, <span style={{ color: "var(--saffron)" }}>{user?.name || "Citizen"}!</span>
              </h1>
              <p style={{ color: "var(--white-50)", fontSize: 15, maxWidth: 500, lineHeight: 1.6 }}>
                Your digital gateway to citizen services. File complaints, track progress, and make your voice heard.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <span className="badge badge-green">✅ Secure & Verified</span>
                <span className="badge badge-orange">🤖 AI Available</span>
                <span className="badge badge-blue">⚡ Fast Resolution</span>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" onClick={onCreateComplaint}>
              ➕ Create New Complaint
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          {stats.map((s, i) => (
            <div key={i} className={`card stagger-${i + 1}`} style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>{s.icon}</span>
                <span style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "var(--font-mono)" }}>{s.value}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--white-50)", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Complaints list */}
        <div className="card stagger-3" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>📋</span>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Your Complaints</h2>
              <span className="badge badge-orange">{complaints.length} total</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {FILTERS.map((f) => (
                <button key={f.value} onClick={() => setFilter(f.value)} className={`btn btn-sm ${filter === f.value ? "btn-primary" : "btn-secondary"}`}>{f.label}</button>
              ))}
            </div>
          </div>

          {filteredComplaints.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 24px" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--white-05)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 20px" }}>📭</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                No complaints found
              </h3>
              <p style={{ color: "var(--white-50)", marginBottom: 24, maxWidth: 300, margin: "0 auto 24px" }}>
                {filter === "ALL"
                  ? "You haven't filed any complaints yet. Start by creating your first complaint."
                  : `You have no complaints with status "${formatStatusLabel(filter)}".`}
              </p>
              {filter === "ALL" && (
                <button className="btn btn-primary" onClick={onCreateComplaint}>➕ File Your First Complaint</button>
              )}
              <div style={{ marginTop: 24, padding: "14px 20px", background: "var(--white-05)", borderRadius: 10, border: "1px solid var(--border)", maxWidth: 380, margin: "24px auto 0", fontSize: 13, color: "var(--white-50)", lineHeight: 1.5 }}>
                🛡️ Your complaints are handled by official government departments with full privacy protection.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredComplaints.map((c, i) => (
                <div key={c.id ?? i} className="glass-panel" style={{ padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{CATEGORY_ICONS[c.category] || "📌"}</div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>
                      {`${(c.category || "other").charAt(0).toUpperCase() + (c.category || "other").slice(1)} Issue`}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--white-50)", marginBottom: 6, lineHeight: 1.5 }}>
                      {c.description?.slice(0, 100)}{c.description?.length > 100 ? "..." : ""}
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      {c.location?.address && (
                        <span style={{ fontSize: 12, color: "var(--white-50)" }}>
                          📍 {c.location.address.slice(0, 50)}{c.location.address.length > 50 ? "..." : ""}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: "var(--white-50)" }}>🕐 {formatComplaintDate(c)}</span>
                      {c.photos?.length > 0 && (
                        <span style={{ fontSize: 12, color: "var(--white-50)" }}>📸 {c.photos.length} photo{c.photos.length > 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    <span className={`badge ${STATUS_COLOR[normalizeStatus(c.status)] || "badge-gold"}`}>{formatStatusLabel(normalizeStatus(c.status))}</span>
                    <span style={{ fontSize: 11, color: "var(--white-50)", fontFamily: "var(--font-mono)" }}>{c.referenceNo || `CMP-${String(c.id ?? "N/A")}`}</span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusUpdate(c.id, "IN_PROGRESS")}
                        disabled={!c.id || updatingId === c.id || normalizeStatus(c.status) === "IN_PROGRESS"}
                      >
                        Mark In Progress
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleStatusUpdate(c.id, "RESOLVED")}
                        disabled={!c.id || updatingId === c.id || normalizeStatus(c.status) === "RESOLVED"}
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, textAlign: "center", padding: "16px", fontSize: 12, color: "var(--white-30, rgba(255,255,255,0.3))" }}>
          🇮🇳 भारत सरकार · Government of India · Secure Citizen Portal · All data encrypted
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

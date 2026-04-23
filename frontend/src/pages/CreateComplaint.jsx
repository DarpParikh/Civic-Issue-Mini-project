import { useState, useRef, useCallback } from "react";
import { chatWithAi, createComplaint, sendComplaintMail } from "../api";
import "../styles.css";

const CATEGORIES = [
  { id: "garbage",      name: "Garbage",       icon: "🗑️", dept: "Municipal Corporation",    email: "sanitation@municipal.gov.in" },
  { id: "water",        name: "Water Leakage", icon: "💧", dept: "Water Supply Board",        email: "waterboard@gov.in" },
  { id: "road",         name: "Road Damage",   icon: "🛣️", dept: "PWD Department",            email: "pwd@gov.in" },
  { id: "electricity",  name: "Electricity",   icon: "⚡", dept: "DISCOM",                    email: "electricity@discom.in" },
  { id: "streetlight",  name: "Street Light",  icon: "💡", dept: "Municipal Corp.",           email: "streetlights@municipal.gov.in" },
  { id: "sewage",       name: "Sewage",         icon: "🚽", dept: "Sewage Authority",          email: "sewage@municipal.gov.in" },
  { id: "noise",        name: "Noise Pollution",icon: "🔊", dept: "Pollution Control Board",  email: "noise@pcb.gov.in" },
  { id: "encroachment", name: "Encroachment",  icon: "🏗️", dept: "Revenue Department",       email: "revenue@gov.in" },
  { id: "strayanimals", name: "Stray Animals", icon: "🐕", dept: "Animal Control",            email: "animals@municipal.gov.in" },
  { id: "airpollution", name: "Air Pollution",  icon: "🌫️", dept: "Pollution Control Board",  email: "air@pcb.gov.in" },
  { id: "treefalling",  name: "Fallen Tree",   icon: "🌳", dept: "Forest Department",         email: "forest@gov.in" },
  { id: "other",        name: "Other",          icon: "📌", dept: "General Administration",   email: "grievance@gov.in" },
];

const SEVERITY_LABELS = ["", "Minor", "Low", "Moderate", "High", "Critical"];
const SEVERITY_COLORS = ["", "#4dcc44", "#90cc44", "#f0c040", "#ff8800", "#ff3333"];

function buildEmailDraft(category, description, location, user, severity, refNo) {
  const cat = CATEGORIES.find(c => c.id === category) || CATEGORIES[11];
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const loc = location?.address || "Not specified";

  return `To,
The Concerned Officer,
${cat.dept},
Government of India

Subject: Complaint Regarding ${cat.name} Issue at ${loc} — Ref No: ${refNo}

Respected Sir/Madam,

I, ${user?.name || "Concerned Citizen"} (Email: ${user?.email || "citizen@example.com"}), hereby bring to your kind attention the following civic issue that requires immediate action.

Issue Category : ${cat.name.toUpperCase()}
Severity       : ${SEVERITY_LABELS[severity] || "Moderate"}
Date Filed     : ${today}
Location       : ${loc}
${location?.coords ? `GPS Coordinates: ${location.coords}` : ""}

Description of the Problem:
${description || "[No description provided]"}

This issue has been causing significant inconvenience to the residents of the area and requires prompt intervention from your department.

I would appreciate:
1. Acknowledgment of this complaint within 48 hours
2. Assignment of a dedicated officer to resolve this issue
3. Resolution within the stipulated timeframe
4. Status updates via email: ${user?.email || "citizen@example.com"}

Thanking you in anticipation,

Yours faithfully,
${user?.name || "Concerned Citizen"}
${user?.email || "citizen@example.com"}
Reference No : ${refNo}
Filed via    : CivicVoice — AI-Powered Citizen Portal`;
}

export default function CreateComplaint({ user, onBack, onSuccess }) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState(3);
  const [location, setLocation] = useState(null);
  const [manualAddress, setManualAddress] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");
  const [photos, setPhotos] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailGenerated, setEmailGenerated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [complaintId, setComplaintId] = useState(null);
  const [complaintSaved, setComplaintSaved] = useState(false);
  const [chatCommand, setChatCommand] = useState("");
  const [chatting, setChatting] = useState(false);
  const [sendingMail, setSendingMail] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [savedComplaintData, setSavedComplaintData] = useState(null);
  const [toast, setToast] = useState(null);

  // Two separate refs: one for gallery (images), one for all files
  const galleryRef = useRef();
  const filesRef = useRef();

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Location ────────────────────────────────────────────
  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) { setLocError("Geolocation not supported by your browser."); return; }
    setLocLoading(true); setLocError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let address = `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          if (data.display_name) address = data.display_name;
        } catch {}
        setLocation({ address, coords: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
        setManualAddress(address);
        setLocLoading(false);
        showToast("📍 Location fetched successfully!", "success");
      },
      () => {
        setLocError("Could not fetch location. Please allow location access or enter manually.");
        setLocLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const applyManualAddress = () => {
    if (!manualAddress.trim()) return;
    setLocation({ address: manualAddress.trim(), coords: null });
    showToast("📍 Location set manually", "success");
  };

  // ── Photos ──────────────────────────────────────────────
  const addPhotos = (files) => {
    const remaining = 10 - photos.length;
    if (remaining <= 0) { showToast("Maximum 10 photos allowed", "error"); return; }
    const newPhotos = Array.from(files).slice(0, remaining).map(f => ({
      file: f,
      url: URL.createObjectURL(f),
      name: f.name,
    }));
    setPhotos(p => [...p, ...newPhotos]);
  };

  const removePhoto = (i) => {
    setPhotos(p => {
      URL.revokeObjectURL(p[i].url);
      return p.filter((_, idx) => idx !== i);
    });
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    addPhotos(e.dataTransfer.files);
  }, [photos]);

  // ── Email ───────────────────────────────────────────────
  const generateEmail = async () => {
    if (!category) { showToast("Please select a category first", "error"); return; }
    setEmailLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const refNo = `CMP-${Date.now().toString().slice(-8)}`;
    const draft = buildEmailDraft(category, description, location, user, severity, refNo);
    setEmailDraft(draft);
    setEmailGenerated(true);
    setEmailLoading(false);
    showToast("✉️ Email draft generated!", "success");
  };

  // ── Save complaint only (no direct email send) ───────────
  const handleSubmit = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    setSubmitting(true);

    const cat = CATEGORIES.find(c => c.id === category);
    const refNo = emailDraft.match(/Reference No\s*:\s*(CMP-\d+)/)?.[1] || `CMP-${Date.now().toString().slice(-8)}`;
    const coordParts = location?.coords ? location.coords.split(",").map(v => Number(v.trim())) : [];
    const latitude = Number.isFinite(coordParts[0]) ? coordParts[0] : null;
    const longitude = Number.isFinite(coordParts[1]) ? coordParts[1] : null;

    const complaintPayload = {
      description,
      category,
      severity: String(severity),
      latitude,
      longitude,
      email: user?.email || "",
    };

    const newComplaint = {
      referenceNo: refNo,
      category,
      description,
      severity,
      location: location || (manualAddress ? { address: manualAddress, coords: null } : {}),
      photos: photos.map(p => ({ url: p.url, name: p.name })),
      emailDraft,
      status: "Pending",
      department: cat?.dept || "General Administration",
      departmentEmail: cat?.email || "grievance@gov.in",
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    };

    console.log("[CreateComplaint] Submitting complaint payload:", complaintPayload);

    try {
      const responseData = await createComplaint(complaintPayload);
      console.log("[CreateComplaint] Complaint saved in backend:", responseData);

      const savedComplaint = {
        ...newComplaint,
        ...responseData,
        category: responseData?.category || newComplaint.category,
        description: responseData?.description || newComplaint.description,
        severity: responseData?.severity ?? newComplaint.severity,
        status: responseData?.status || newComplaint.status,
      };

      setSavedComplaintData(savedComplaint);
      setComplaintId(responseData?.id || null);
      setComplaintSaved(true);
      setEmailDraft(responseData?.aiGeneratedText || emailDraft);
      setEmailGenerated(true);

      setChatMessages([
        {
          role: "assistant",
          content: "Complaint saved. Tell me how you want to modify this email draft, then click 'Apply AI Changes'.",
        },
      ]);

      showToast("✅ Complaint saved. Use AI chat to modify and then send.", "success");
    } catch (error) {
      console.error("[CreateComplaint] Complaint submission failed:", error);
      console.error("[CreateComplaint] API error response:", error?.response?.data);
      alert("Failed to submit complaint. Please check backend connection and try again.");
      showToast("❌ Failed to submit complaint", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiModifyDraft = async () => {
    const command = chatCommand.trim();
    if (!command) {
      showToast("Please enter a command for AI.", "error");
      return;
    }
    if (!complaintSaved) {
      showToast("Save complaint first before using AI commands.", "error");
      return;
    }

    setChatting(true);
    setChatMessages((prev) => [...prev, { role: "user", content: command }]);

    const aiPrompt = `You are an assistant helping revise an official complaint email.
Return only the revised email body.

Current draft:
${emailDraft}

User command:
${command}`;

    try {
      const aiResponse = await chatWithAi(aiPrompt);
      const revisedDraft = typeof aiResponse === "string" ? aiResponse : String(aiResponse || "");
      setEmailDraft(revisedDraft);
      setChatMessages((prev) => [...prev, { role: "assistant", content: revisedDraft }]);
      setChatCommand("");
      showToast("🤖 AI updated your draft.", "success");
    } catch (error) {
      console.error("[CreateComplaint] AI modification failed:", error);
      setChatMessages((prev) => [...prev, { role: "assistant", content: "AI is unavailable right now. Please try again." }]);
      showToast("❌ AI modification failed.", "error");
    } finally {
      setChatting(false);
    }
  };

  const handleSendMail = async () => {
    if (!complaintId) {
      showToast("Complaint ID missing. Save complaint first.", "error");
      return;
    }

    setSendingMail(true);
    try {
      const mailResult = await sendComplaintMail(complaintId, emailDraft);
      console.log("[CreateComplaint] Mail send result:", mailResult);
      showToast("📧 Mail sent successfully.", "success");
      if (savedComplaintData) {
        setTimeout(() => onSuccess(savedComplaintData), 400);
      }
    } catch (error) {
      console.error("[CreateComplaint] Mail send failed:", error);
      showToast("❌ Failed to send mail.", "error");
    } finally {
      setSendingMail(false);
    }
  };

  const selectedCat = CATEGORIES.find(c => c.id === category);
  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;
  const canNext1 = category && description.length >= 20;
  const canNext2 = !!(location || manualAddress.trim());
  const canSubmit = !!category && description.trim().length >= 20 && !!(location || manualAddress.trim()) && !submitting && !complaintSaved;

  return (
    <div className="page-container">
      <div className="bg-mesh" />
      <div className="bg-grid" />

      {/* Header */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,15,46,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "var(--white-50)" }}>New Complaint · Step {step} of 3</div>
            <div className="progress-bar" style={{ marginTop: 4 }}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <span className="badge badge-green">🔒 Secure Portal</span>
        </div>
      </nav>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px", position: "relative", zIndex: 1 }}>

        {/* Page hero */}
        <div style={{ textAlign: "center", marginBottom: 32 }} className="animate-in">
          <div style={{ width: 70, height: 70, borderRadius: "50%", background: "conic-gradient(var(--saffron) 0deg 120deg, white 120deg 240deg, var(--india-green) 240deg 360deg)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 30px rgba(0,0,0,0.3)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📝</div>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 900, marginBottom: 6 }}>File New Complaint</h1>
          <p style={{ color: "var(--white-50)", fontSize: 14 }}>भारत सरकार · Government of India — Secure Complaint Portal</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
            <span className="badge badge-orange">🤖 AI-Powered Routing</span>
            <span className="badge badge-blue">⏰ 24/7 Processing</span>
            <span className="badge badge-gold">⭐ Verified Platform</span>
          </div>
        </div>

        {/* Step indicators */}
        <div className="card stagger-1" style={{ padding: "18px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {[{ n: 1, label: "Details" }, { n: 2, label: "Location & Photos" }, { n: 3, label: "Email & Submit" }].map((s, i) => (
              <div key={s.n} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className={`step-dot ${step > s.n ? "done" : step === s.n ? "active" : "inactive"}`}>
                    {step > s.n ? "✓" : s.n}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: step === s.n ? 700 : 400, color: step === s.n ? "var(--white)" : "var(--white-50)", whiteSpace: "nowrap" }}>{s.label}</span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 2, background: step > s.n + 1 ? "var(--india-green)" : step > s.n ? "var(--saffron)" : "var(--border)", margin: "0 12px", borderRadius: 1, transition: "background 0.3s" }} />}
              </div>
            ))}
          </div>
        </div>

        {/* ── STEP 1: Details ── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="stagger-2">

            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🏷️ Select Issue Category</h3>
              <p style={{ fontSize: 13, color: "var(--white-50)", marginBottom: 16 }}>Choose the category that best describes your complaint</p>
              <div className="category-grid">
                {CATEGORIES.map(c => (
                  <div key={c.id} className={`category-card ${category === c.id ? "selected" : ""}`} onClick={() => setCategory(c.id)}>
                    <span className="category-icon">{c.icon}</span>
                    <div className="category-name">{c.name}</div>
                    {category === c.id && <div style={{ marginTop: 4, fontSize: 10, color: "var(--saffron)", fontWeight: 600 }}>✓ Selected</div>}
                  </div>
                ))}
              </div>
              {selectedCat && (
                <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(255,107,0,0.06)", border: "1px solid rgba(255,107,0,0.2)", borderRadius: 10, fontSize: 13, display: "flex", gap: 10, alignItems: "center" }}>
                  <span>{selectedCat.icon}</span>
                  <div>
                    <span style={{ fontWeight: 600, color: "var(--saffron)" }}>{selectedCat.name}</span>
                    <span style={{ color: "var(--white-50)" }}> → Will be routed to </span>
                    <span style={{ fontWeight: 600 }}>{selectedCat.dept}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📝 Describe Your Issue</h3>
              <p style={{ fontSize: 13, color: "var(--white-50)", marginBottom: 16 }}>Provide detailed information to help us understand and resolve your concern</p>
              <textarea
                className="input-field"
                style={{ minHeight: 160 }}
                placeholder={`Describe your complaint in detail. Include:\n• What happened?\n• When did it occur?\n• Where did it happen?\n• Who was involved?\n• What resolution are you seeking?`}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <div style={{ fontSize: 12, color: description.length < 20 ? "var(--error)" : "var(--white-50)", marginTop: 8, textAlign: "right" }}>
                {description.length} chars {description.length < 20 ? `(minimum 20 required)` : "✓"}
              </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>⚠️ Severity Level</h3>
              <p style={{ fontSize: 13, color: "var(--white-50)", marginBottom: 16 }}>How urgent is this issue?</p>
              <input type="range" min="1" max="5" value={severity} onChange={e => setSeverity(Number(e.target.value))} style={{ width: "100%", marginBottom: 10 }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--white-50)", marginBottom: 14 }}>
                <span>Minor</span><span>Low</span><span>Moderate</span><span>High</span><span>Critical</span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, background: `${SEVERITY_COLORS[severity]}22`, border: `1px solid ${SEVERITY_COLORS[severity]}44` }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: SEVERITY_COLORS[severity] }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: SEVERITY_COLORS[severity] }}>{SEVERITY_LABELS[severity]}</span>
              </div>
            </div>

            <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(2)} disabled={!canNext1}>
              Continue to Location & Photos →
            </button>
          </div>
        )}

        {/* ── STEP 2: Location & Photos ── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="stagger-2">

            {/* Location */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📍 Issue Location</h3>
              <p style={{ fontSize: 13, color: "var(--white-50)", marginBottom: 16 }}>Help us locate the problem accurately</p>

              <button className="btn btn-green btn-full" onClick={fetchCurrentLocation} disabled={locLoading} style={{ marginBottom: 16 }}>
                {locLoading ? <><span className="spinner" /> Fetching Location...</> : <>📡 Use My Current Location</>}
              </button>

              {locError && (
                <div style={{ color: "var(--error)", fontSize: 13, marginBottom: 12, padding: "10px 14px", background: "rgba(255,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(255,68,68,0.2)" }}>
                  ⚠️ {locError}
                </div>
              )}

              {location && (
                <div className="location-display" style={{ marginBottom: 16 }}>
                  <span className="location-icon">📍</span>
                  <div>
                    <div className="location-text" style={{ fontWeight: 500 }}>{location.address}</div>
                    {location.coords && <div className="location-coords">GPS: {location.coords}</div>}
                  </div>
                </div>
              )}

              <div className="divider">or enter address manually</div>

              <div style={{ display: "flex", gap: 10 }}>
                <div className="input-icon-wrap" style={{ flex: 1 }}>
                  <span className="icon">🗺️</span>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="e.g. Near City Park, MG Road, Bengaluru"
                    value={manualAddress}
                    onChange={e => setManualAddress(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && applyManualAddress()}
                  />
                </div>
                <button className="btn btn-ghost" onClick={applyManualAddress}>Set</button>
              </div>
            </div>

            {/* Photo Upload — Gallery & Files only, NO camera */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📸 Upload Photos / Evidence</h3>
              <p style={{ fontSize: 13, color: "var(--white-50)", marginBottom: 16 }}>
                Attach photos to help authorities understand the issue faster (optional, max 10)
              </p>

              {/* Hidden file inputs — no capture attribute = gallery/files only */}
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                multiple
                onChange={e => addPhotos(e.target.files)}
                style={{ display: "none" }}
              />
              <input
                ref={filesRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={e => addPhotos(e.target.files)}
                style={{ display: "none" }}
              />

              {/* Upload option buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: "20px 16px", flexDirection: "column", gap: 8, height: "auto", borderRadius: "var(--radius-sm)", border: "2px dashed var(--border)" }}
                  onClick={() => galleryRef.current?.click()}
                >
                  <span style={{ fontSize: 28 }}>🖼️</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Gallery</span>
                  <span style={{ fontSize: 11, color: "var(--white-50)" }}>Browse your photos</span>
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: "20px 16px", flexDirection: "column", gap: 8, height: "auto", borderRadius: "var(--radius-sm)", border: "2px dashed var(--border)" }}
                  onClick={() => filesRef.current?.click()}
                >
                  <span style={{ fontSize: 28 }}>📂</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Files</span>
                  <span style={{ fontSize: 11, color: "var(--white-50)" }}>Browse file system</span>
                </button>
              </div>

              {/* Drag & drop zone */}
              <div
                className={`upload-zone ${dragging ? "drag-over" : ""}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                style={{ marginBottom: photos.length > 0 ? 16 : 0 }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>⬆️</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Or drag & drop images here</div>
                <div style={{ fontSize: 12, color: "var(--white-50)" }}>Supports JPG, PNG, WEBP · Max 10 photos · 5MB each</div>
              </div>

              {/* Photo thumbnails */}
              {photos.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, color: "var(--white-50)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>📸</span>
                    <span>{photos.length} photo{photos.length > 1 ? "s" : ""} selected</span>
                    {photos.length >= 10 && <span className="badge badge-orange">Max reached</span>}
                  </div>
                  <div className="photo-grid">
                    {photos.map((p, i) => (
                      <div key={i} className="photo-thumb">
                        <img src={p.url} alt={p.name} />
                        <button className="remove-btn" onClick={() => removePhoto(i)}>✕</button>
                      </div>
                    ))}
                    {photos.length < 10 && (
                      <div
                        style={{ aspectRatio: 1, border: "2px dashed var(--border)", borderRadius: "var(--radius-sm)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 6, transition: "var(--transition)" }}
                        onClick={() => galleryRef.current?.click()}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--saffron)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                      >
                        <span style={{ fontSize: 22 }}>➕</span>
                        <span style={{ fontSize: 11, color: "var(--white-50)" }}>Add more</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ minWidth: 120 }}>← Back</button>
              <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(3)} disabled={!canNext2}>
                Continue to Email Draft →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: AI Email + Submit ── */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="stagger-2">

            {/* Summary */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📋 Complaint Summary</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Category",    value: selectedCat ? `${selectedCat.icon} ${selectedCat.name}` : "—" },
                  { label: "Severity",    value: SEVERITY_LABELS[severity], color: SEVERITY_COLORS[severity] },
                  { label: "Location",    value: (location?.address || manualAddress || "—").slice(0, 55) + ((location?.address || manualAddress || "").length > 55 ? "..." : "") },
                  { label: "Photos",      value: `${photos.length} uploaded` },
                  { label: "Routes To",   value: selectedCat?.dept || "—" },
                  { label: "Dept. Email", value: selectedCat?.email || "—" },
                ].map((r, i) => (
                  <div key={i} style={{ background: "var(--white-05)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ fontSize: 11, color: "var(--white-50)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>{r.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: r.color || "var(--white)" }}>{r.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Email */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>✉️ AI-Generated Official Email</h3>
              <p style={{ fontSize: 13, color: "var(--white-50)", marginBottom: 20 }}>
                First save complaint details. Then command AI to modify the draft, and send mail only when you confirm.
              </p>

              {!emailGenerated ? (
                <div style={{ textAlign: "center", padding: "28px 24px" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
                  <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Ready to Generate Your Email</h4>
                  <p style={{ fontSize: 13, color: "var(--white-50)", marginBottom: 24, maxWidth: 340, margin: "0 auto 24px", lineHeight: 1.6 }}>
                    Click below and AI will create a professional, formal complaint email tailored to your issue.
                  </p>
                  <button className="btn btn-primary btn-lg" onClick={generateEmail} disabled={emailLoading}>
                    {emailLoading ? <><span className="spinner" /> Drafting your email...</> : <>🤖 Generate AI Email Draft</>}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="email-preview">
                    <div className="email-header">
                      <span>✉️</span>
                      <span>To: {selectedCat?.email}</span>
                      <span className="badge badge-green" style={{ marginLeft: "auto" }}>AI Generated</span>
                    </div>
                    <div className="email-body">{emailDraft}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(emailDraft); showToast("📋 Copied to clipboard!", "success"); }}>
                      📋 Copy Email
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={generateEmail}>
                      🔄 Regenerate
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { window.location.href = `mailto:${selectedCat?.email}?subject=Civic Complaint - ${selectedCat?.name}&body=${encodeURIComponent(emailDraft)}`; }}>
                      📤 Open in Mail App
                    </button>
                  </div>

                  {complaintSaved && (
                    <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 10, padding: 14, background: "var(--white-05)" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🤖 AI Chat Commands</div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <input
                          className="input-field"
                          style={{ flex: 1 }}
                          value={chatCommand}
                          onChange={(e) => setChatCommand(e.target.value)}
                          placeholder="e.g. make tone more strict and concise"
                        />
                        <button className="btn btn-secondary" onClick={handleAiModifyDraft} disabled={chatting}>
                          {chatting ? "Applying..." : "Apply AI Changes"}
                        </button>
                      </div>
                      <div style={{ maxHeight: 180, overflowY: "auto", fontSize: 12, color: "var(--white-50)", display: "flex", flexDirection: "column", gap: 8 }}>
                        {chatMessages.map((m, idx) => (
                          <div key={idx} style={{ background: "var(--white-05)", border: "1px solid var(--border)", borderRadius: 8, padding: 8 }}>
                            <strong>{m.role === "user" ? "You" : "AI"}:</strong> {m.content}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ background: "var(--white-05)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "var(--white-50)", lineHeight: 1.6 }}>
              🛡️ By submitting, you certify that the information is accurate. False complaints may result in action per government guidelines.
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setStep(2)} style={{ minWidth: 120 }}>← Back</button>
              <button className="btn btn-primary btn-full btn-lg" onClick={handleSubmit} disabled={!canSubmit}>
                {submitting ? <><span className="spinner" /> Saving...</> : complaintSaved ? <>✅ Complaint Saved</> : <>💾 Save Complaint</>}
              </button>
              <button className="btn btn-green btn-full btn-lg" onClick={handleSendMail} disabled={!complaintSaved || sendingMail}>
                {sendingMail ? <><span className="spinner" /> Sending Mail...</> : <>📧 Send Mail</>}
              </button>
            </div>

            {!emailGenerated && (
              <div style={{ textAlign: "center", fontSize: 13, color: "var(--white-50)" }}>
                ⚠️ Please generate the AI email draft before submitting
              </div>
            )}
          </div>
        )}
      </main>

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}

      <style>{`
        @media (max-width: 600px) {
          .category-grid { grid-template-columns: repeat(3, 1fr) !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

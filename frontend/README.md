# 🇮🇳 CivicVoice — AI-Powered Civic Issue Reporting Platform

## Frontend Stack
- **React 18** + Vite
- **Pure CSS** (no UI library) — custom design system
- **Google Fonts**: Playfair Display + DM Sans + JetBrains Mono

## Features Built

### 🔐 Auth
- Login page with split-panel layout (brand story left, form right)
- Register page with form validation

### 🏠 Dashboard
- Welcome hero with user greeting
- Stats grid (Total, Resolved, In Progress, Pending)
- Complaints list with status filters
- Empty state with CTA

### 📝 Create Complaint (3-Step Wizard)
**Step 1 — Details:**
- 12 issue categories with icons (Garbage, Water, Road, Electricity, etc.)
- Smart routing display — shows which department receives the complaint
- Detailed description textarea (min 20 chars)
- Severity slider (Minor → Critical) with color coding

**Step 2 — Location & Photos:**
- 📡 **Real GPS location** using browser Geolocation API
- 🗺️ **Reverse geocoding** via OpenStreetMap Nominatim (free, no API key)
- Manual address input as fallback
- 📸 **Gallery upload** with drag-and-drop zone
- Photo grid with thumbnails and individual remove buttons
- Add more photos button

**Step 3 — AI Email & Submit:**
- Complaint summary card
- 🤖 **AI email draft generation** — creates a formal, professional complaint letter based on:
  - Issue category & department
  - User's description
  - Location details
  - Severity level
  - Auto-generated reference number
- Copy to clipboard
- Open in mail app (mailto link)
- Regenerate option

## Design System
- Dark navy base with saffron/green/gold accents (Indian tricolor theme)
- Glassmorphism cards with backdrop blur
- Animated gradient mesh background
- Step progress indicator
- Toast notifications
- CSS-only animations (fadeUp, pulse, shimmer)

## Setup

```bash
# Copy these files into your frontend folder
# Or create a new folder:

cd civic-portal
npm install
npm run dev
# → http://localhost:5174
```

## File Structure
```
src/
├── App.jsx              # Router (page state machine)
├── styles.css           # Full design system
├── index.jsx            # Entry point
└── pages/
    ├── Login.jsx        # Auth login
    ├── Register.jsx     # New citizen registration
    ├── Dashboard.jsx    # Main dashboard
    └── CreateComplaint.jsx  # 3-step complaint wizard
```

## Integration with Your Backend
Replace the mock `await new Promise(r => setTimeout(r, 1000))` calls with real API calls:

```js
// Login
const res = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// Submit complaint
const formData = new FormData();
formData.append('category', category);
formData.append('description', description);
photos.forEach(p => formData.append('photos', p.file));
await fetch('http://localhost:3000/api/complaints', { method: 'POST', body: formData });
```

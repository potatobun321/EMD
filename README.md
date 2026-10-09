<div align="center">
  <img src="EMD.png" alt="EMD Logo" width="140" />
  <h1>EMD — Event Management Database</h1>
  <p><strong>Open-Source Low-to-Mid Level Event Operations Platform</strong></p>
</div>

---

## Overview

EMD (Event Management Database) is a lightweight, zero-cost event operations engine designed for small-to-mid scale events (up to 3,000+ attendees). It provides real-time attendee tracking, QR code check-ins, email pass dispatching, and offline-capable mobile scanner tools without requiring dedicated server infrastructure.

The system uses Google Workspace (Google Sheets and Google Apps Script) as a serverless backend database paired with a mobile Progressive Web Application (PWA) scanner interface for volunteers.

---

## Key Use Cases

- **Conference & Conclave Access Control**: Validate delegate credentials at main entrances, hall entrances, and specific tracks.
- **Meal & Logistics Tracking**: Enforce entitlement rules for breakfasts, lunches, dinners, or resident-only sessions.
- **Badge & Pass Dispatch**: Mint QR passes and deliver them via email with daily quota management.
- **Offline Registration Desks**: Continue scanning attendees when venue Wi-Fi or cellular networks drop.
- **Device Management**: Restrict volunteer access to authorized phones to prevent credential sharing.

---

## Key Features

- **Stateless Webhook API**: Google Apps Script acts as an API gateway handling authentication, scan validation, and metrics aggregation.
- **Offline PWA Scanner**: Built with HTML5, CSS3, and ES6 JS. Uses IndexedDB for offline queuing and background sync.
- **Idempotent Synchronization**: Scans generate a unique clientScanId (UUIDv4) to guarantee zero double-entry logs during retries or offline flushes.
- **Device Binding**: Accounts bind to primary and backup device IDs to maintain volunteer session security.
- **Concurrency Guards**: Uses Google LockService for atomic append-only ledger entries in Google Sheets.
- **Compact Memory Caching**: Uses CacheService chunking to eliminate spreadsheet read latency for up to 10,000 attendees.

---

## Repository Structure

```text
EMD/
├── frontend/                   # Client-side PWA Scanner app
│   ├── index.html              # Main HTML scanner view
│   ├── manifest.json           # Web App Manifest
│   ├── service-worker.js       # Offline service worker cache
│   ├── css/
│   │   └── style.css           # Minimalist CSS styles
│   ├── js/
│   │   ├── config.js           # Runtime API configuration
│   │   ├── api.js              # API client methods
│   │   ├── auth.js             # Session & device binding logic
│   │   ├── offlineQueue.js     # IndexedDB offline store
│   │   ├── scanner.js          # Camera & QR reader controller
│   │   └── ui.js               # UI router and event handlers
│   └── icons/                  # PWA application icons
├── backend/                    # Google Apps Script Web App Engine
│   ├── .clasp.json.template    # Clasp CLI deployment configuration
│   └── src/
│       ├── 01_WebhookAPI.gs    # API gateway and action router
│       ├── 02_ScannerHandlers.gs # Core scan validation & caching engine
│       ├── 03_AuthAndHelpers.gs  # Volunteer authentication & device locks
│       ├── 04_SetupWorkbook.gs # Database schema initializer
│       ├── 05_QRGenerator.gs   # Sequential ID & QuickChart QR minter
│       ├── 07_CSVImporter.gs   # Dynamic registration CSV importer
│       ├── 08_DashboardAPI.gs  # Real-time metrics & device manager
│       ├── EmailService.gs     # Quota-safe 100 passes/day email engine
│       ├── IDCardEmailTemplate.html # HTML pass template
│       └── appscript.json      # Project manifest (Asia/Kolkata timezone)
├── extensions/                 # Integrations and export helpers
│   ├── google-form-exporter/   # Google Form response exporter
│   └── vishwam-form-webhook/   # Global forum submission webhook
├── docs/                       # Detailed manuals and specs
│   ├── SETUP_AND_MIGRATION_GUIDE.md
│   ├── API_CONTRACT_AND_SPEC.md
│   ├── BACKEND_ARCHITECTURE_BRIEF.md
│   ├── SYSTEM_DOCUMENTATION.md
│   └── JAI_CONCLAVE_2026_MASTER_MANUAL.md
├── scripts/                    # Automation and setup scripts
│   ├── setup.sh                # Local environment setup script
│   └── deploy-backend.sh       # Clasp deployment helper script
├── EMD.png                     # System Logo
├── .env.example                # Environment variables template
├── package.json                # NPM tooling configuration
└── README.md                   # Project documentation
```

---

## Setup and Usage

### 1. Backend Setup (Google Workspace)

1. Create a new Google Sheet named `EMD Master Database`.
2. Open **Extensions > Apps Script**.
3. Enable manifest file view (Project Settings > Show `appsscript.json`).
4. Copy the files from `backend/src/` into the editor.
5. Run `setupWorkbook()` once to build the relational sheet schema (`00_Configuration` to `05_Automation_Log`).
6. Populate `00_Configuration` with Drive folder IDs and volunteer PIN credentials.
7. Deploy as Web App:
   - **Execute as**: `Me`
   - **Access**: `Anyone`
8. Note the deployed Web App URL (`https://script.google.com/macros/s/.../exec`).

### 2. Frontend Configuration (PWA Scanner)

1. Set the deployed Web App URL in `frontend/js/config.js`:
   ```javascript
   API_URL: "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",
   ```
2. Serve the `frontend/` directory via GitHub Pages, Vercel, Netlify, or any static HTTP web server.

### 3. Local Development

```bash
# Install dependencies
npm run setup

# Serve frontend locally
npm run dev
```

---

## Future Roadmap

- **Self-Hosted Engine**: Port the Google Apps Script backend to a standalone self-hosted service (Node.js / Go with SQLite or PostgreSQL) for full infrastructure freedom, zero Google daily quota limits, and higher request throughput.
- **Custom Webhook Integrations**: Native support for third-party ticketing platforms (Townscript, Eventbrite, Unstop) via inbound webhooks.
- **Enhanced Local Cache**: Full offline participant database caching with client-side cryptographic signature verification for completely disconnected venues.
- **Thermal Printer Support**: Bluetooth and WebUSB integration for instant physical badge printing upon check-in.

---

## License

Distributed under the [MIT License](LICENSE).

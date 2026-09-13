# 🏛️ JAI Conclave 2026 — Google Apps Script Migration & Setup Guide
> **Official Workplace Deployment Manual for New Google Workspace / Gmail ID**  
> *Everything in this `_takeaway/` directory is finalized, tested, and stripped of all junk/test scripts.*

---

## 📋 Quick Confirmation on Your Questions

> **Q: Do I have to change the URLs for the Google Drive folders to the new ones I make?**  
> **A: YES, 100% correct!**  
> In your new Google Drive, create 4 folders, copy each folder's ID from its URL, and paste them into Column B of sheet `00_Configuration`.

> **Q: Do I copy-paste the deployed Web App URL into this repository?**  
> **A: YES, 100% correct!**  
> After deploying the Apps Script as a Web App, copy the `https://script.google.com/macros/s/.../exec` URL and paste it into line 12 of:
> 1. `js/config.js` (Root GitHub Pages scanner)
> 2. `web/scanner/js/config.js` (Azure Static Web App scanner on `vishwamspeaks.com/scanner/`)

---

## 🗂️ Files in this `_takeaway/` Bundle

| File | Destination | Description |
| :--- | :--- | :--- |
| `01_WebhookAPI.gs` | **EMD Apps Script** | HTTP gateway routing `login`, `scan`, `bulkSync`, `getDashboardStats`, and device management |
| `02_ScannerHandlers.gs` | **EMD Apps Script** | Core scan engine, high-speed 100KB-safe attendee caching, Council/Track mapper |
| `03_AuthAndHelpers.gs` | **EMD Apps Script** | Volunteer PIN auth, device slot lock/backup, cache buster, and custom spreadsheet menu |
| `04_SetupWorkbook.gs` | **EMD Apps Script** | 1-time database schema initializer (creates 6 relational sheets, validations, formulas) |
| `05_QRGenerator.gs` | **EMD Apps Script** | Sequential ID generator (`JAI-26-000001`) and QuickChart QR graphics minter |
| `07_CSVImporter.gs` | **EMD Apps Script** | Automated registration CSV importer with dynamic header mapping and deduplication |
| `08_DashboardAPI.gs` | **EMD Apps Script** | Backend API for Admin Control Center (headcounts and volunteer phone device manager) |
| `EmailService.gs` | **EMD Apps Script** | **Unified 100 Passes/Day batch engine**: auto-mints QRs on the fly, resolves pass image, enforces daily limits |
| `IDCardEmailTemplate.html` | **EMD Apps Script** | HTML email template with embedded pass image, student name, ID, and Council |
| `appscript.json` | **EMD Apps Script** | Manifest file specifying `Asia/Kolkata` time zone, V8 runtime, and OAuth scopes |
| `FORM_SHEET_ONLY_DemoFormExporter.gs` | **Google Form Sheet ONLY** | **DO NOT paste into EMD!** Paste this only into your Google Form responses spreadsheet |

*(Note: `99_DevUtils.gs` and obsolete `06_dashboard.gs` were intentionally excluded to keep the production system 100% clean).*

---

## 🚀 Step-by-Step Setup on Your New Official Account

### Phase 1: Set Up Google Drive Folders (5 Minutes)
1. Log into your official Google account (e.g., `admin@vishwamspeaks.com`).
2. Go to [Google Drive](https://drive.google.com).
3. Create a parent folder named `JAI_Conclave_2026_Operations`.
4. Inside it, create 4 subfolders:
   - `01_QR_Vault` (Where generated QR graphics will be stored)
   - `02_ID_Cards` (Where designed badge passes are stored, if you have custom graphics)
   - `03_CSV_Import` (Where incoming registration CSVs are dropped)
   - `04_CSV_Archive` (Where processed CSVs are automatically moved)
5. **Get Folder IDs**: Open each folder in your browser. Look at the URL:
   `https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i...`  
   The string of letters and numbers after `/folders/` is your **Folder ID**. Note these down.

---

### Phase 2: Create the EMD Master Spreadsheet (5 Minutes)
1. In Google Drive, create a new Google Sheet.
2. Name it: **`JAI Conclave 2026 - EMD Master`**.
3. In the top menu, go to **Extensions > Apps Script**.
4. In the Apps Script project:
   - Click the project title ("Untitled project") and rename it to **`JAI_Conclave_Backend_Engine`**.
   - Click the gear icon ⚙️ (**Project Settings**) on the left sidebar.
   - Check the box: **"Show 'appsscript.json' manifest file in editor"**.
   - Go back to the Editor (< >).

---

### Phase 3: Copy Files into Apps Script (10 Minutes)
1. **`appsscript.json`**:
   - Click `appsscript.json` in the file tree.
   - Replace its entire content with the contents of `_takeaway/appscript.json`.
2. **The 8 Script Files (`.gs`)**:
   - For each file below, click **+ > Script**, name the file (e.g. `01_WebhookAPI`), and paste its code:
     - `01_WebhookAPI`
     - `02_ScannerHandlers`
     - `03_AuthAndHelpers`
     - `04_SetupWorkbook`
     - `05_QRGenerator`
     - `07_CSVImporter`
     - `08_DashboardAPI`
     - `EmailService`
   - *(You can delete the default empty `Code.gs`)*.
3. **The HTML Email Template**:
   - Click **+ > HTML**.
   - Name it: **`IDCardEmailTemplate`** *(do NOT add `.html`, Apps Script adds it automatically)*.
   - Paste the complete contents of `_takeaway/IDCardEmailTemplate.html`.
4. Click the **Save** disk icon (💾) or press `Ctrl + S`.

---

### Phase 4: Initialize the Database (3 Minutes)
1. In the Apps Script toolbar dropdown (which says `Select function`), select **`setupWorkbook`**.
2. Click **▶ Run**.
3. Google will show an **"Authorization Required"** popup:
   - Click **Review Permissions**.
   - Select your official account.
   - Click **Advanced** (bottom left of popup) $\rightarrow$ **Go to JAI_Conclave_Backend_Engine (unsafe)**.
   - Click **Allow**.
4. Switch back to your Google Sheet tab. You will see 6 relational sheets have been created:
   - `00_Configuration`
   - `01_Participants_Master`
   - `02_Operational_State`
   - `03_Activity_Log`
   - `04_Admin_Actions`
   - `05_Automation_Log`

---

### Phase 5: Fill In `00_Configuration` (5 Minutes)
Go to sheet **`00_Configuration`**:

1. **Paste your Drive Folder IDs in Column B**:
   - Row 4 (`QR_Folder_ID`): Paste your `01_QR_Vault` ID
   - Row 5 (`ID_Card_Folder_ID`): Paste your `02_ID_Cards` ID
   - Row 6 (`CSV_Import_Folder_ID`): Paste your `03_CSV_Import` ID
   - Row 7 (`CSV_Archive_Folder_ID`): Paste your `04_CSV_Archive` ID
2. **Verify Daily Email Quota Variables** (Rows 8 to 10 in Column A & B):
   - `Daily_Email_Limit`: `100` (can be changed to 200, 500, etc. anytime)
   - `Daily_Emails_Sent_Today`: `0`
   - `Last_Email_Dispatch_Date`: *(leave blank initially)*
3. **Configure Volunteers in Columns J to Q**:
   - Row 2: `ADM-01` (Admin). Change the PIN in Col L (`123456`) to your executive team PIN.
   - Rows 3+: Enter your real volunteers:
     - `Volunteer_ID` (Col J): e.g. `VOL-01`, `VOL-02`, etc.
     - `Name` (Col K): Volunteer's Full Name
     - `PIN` (Col L): 4-digit numeric PIN (e.g. `4821`)
     - `Active` (Col M): `TRUE`
     - `Assigned_Checkpoints` (Col N): Checkpoint ID (e.g. `ENT`, `CAFD1`, `COU`) or `ALL`
     - Leave `Device_Slot_1` and `Device_Slot_2` blank (they auto-bind on first phone login).
     - `Allow_Backup_Slot` (Col Q): `FALSE`.

---

### Phase 6: Deploy the Web App (3 Minutes)
1. In the Apps Script editor, click the blue **Deploy** button (top right) $\rightarrow$ **New deployment**.
2. Click the gear icon ⚙️ next to "Select type" and select **Web app**.
3. Configure the deployment:
   - **Description**: `JAI Conclave 2026 Production v1.0.0`
   - **Execute as**: **Me (`your-official-email@domain.com`)** *(CRITICAL!)*
   - **Who has access**: **Anyone** *(CRITICAL! Required so volunteer phones can submit scans)*
4. Click **Deploy**.
5. Copy the generated **Web app URL**:
   `https://script.google.com/macros/s/AKfycby.../exec`

---

### Phase 7: Update Web App URL in Repository (2 Minutes)
Open this workspace and replace `API_URL` with your new Web App URL in two files:

1. **[`js/config.js`](file:///c:/Users/GIGA/Desktop/EMD/js/config.js#L12)** (Line 12):
   ```javascript
   API_URL: "https://script.google.com/macros/s/YOUR_NEW_SCRIPT_ID/exec",
   ```
2. **[`web/scanner/js/config.js`](file:///c:/Users/GIGA/Desktop/EMD/web/scanner/js/config.js#L12)** (Line 12):
   ```javascript
   API_URL: "https://script.google.com/macros/s/YOUR_NEW_SCRIPT_ID/exec",
   ```
3. Commit and push:
   - In `web/`: `git add . && git commit -m "feat: link production backend" && git push`
   - In root: `git add . && git commit -m "feat: link production backend" && git push`

---

### Phase 8: Set Up Google Form Responses Sheet (5 Minutes)
1. Open your Google Form for student registrations.
2. Go to **Responses** $\rightarrow$ **View in Sheets** (opens the responses spreadsheet).
3. In that sheet, click **Extensions > Apps Script**.
4. Paste the entire code from `_takeaway/FORM_SHEET_ONLY_DemoFormExporter.gs`.
5. Save and refresh the Google Sheet.
6. A new menu **`JAI Conclave`** will appear at the top:
   - Click **`JAI Conclave > ⚙️ Set Drive Export Folder`**.
   - Paste the Folder ID for `03_CSV_Import`.
7. Whenever you want to export verified registrations, simply click **`JAI Conclave > 📤 Export Batch to Drive`**. It will drop a CSV into `03_CSV_Import`.

---

## ⚡ Daily Event Operations from the Spreadsheet Menu

Refresh your EMD spreadsheet. You will see the **`🏛️ JAI Conclave`** menu in the top bar:

```text
🏛️ JAI Conclave
├── 🚀 Dispatch Today's Batch (100 Passes)   --> Runs unified 100 QRs + Pass Emails
├── ⚡ Generate Missing QRs (100 Batch)       --> Mints QRs without emailing
├── 🔄 Reset Daily Dispatch Counter           --> Resets sent counter to send more today
├── ⏰ Install 10 AM Daily Dispatch Trigger   --> Auto-sends 100 passes daily at 10 AM
├── --------------------------------------
├── 📥 Ingest Registration CSVs              --> Ingests files from 03_CSV_Import
├── 🆔 Generate Sequential IDs               --> Assigns JAI-26-000001 to new attendees
├── ⚡ Refresh Operational State              --> Fast batch sync of scan counts & meals
└── 🔑 Flush All Caches                      --> Clears memory cache for instant updates
```

---

## 🎯 Verification Checklist

Before live event day:
- [ ] Log in as volunteer `VOL-01` on phone $\rightarrow$ Verify phone binds to Slot 1 in `00_Configuration`.
- [ ] Scan a test participant badge $\rightarrow$ Verify screen shows Name, Council (Track), and Room.
- [ ] Scan the same badge twice at Main Entrance $\rightarrow$ Verify amber duplicate alert triggers.
- [ ] Click **`🚀 Dispatch Today's Batch (100 Passes)`** $\rightarrow$ Verify test email delivers with inline pass image.
- [ ] Log in as `ADM-01` $\rightarrow$ Open **Device Manager** $\rightarrow$ Tap `[🔓 Allow Backup]` for a volunteer $\rightarrow$ Verify backup phone signs in successfully.

---
name: webhook-tester
description: >-
  Procedures, payload schemas, and testing workflows for validating webhooks,
  Google Apps Script endpoints, form submission handlers, and external API integrations.
---

# Webhook & API Testing Skill

Use this skill when developing, testing, or debugging frontend-to-backend integrations, form submissions, and webhook handlers.

---

## 1. Webhook Standards for Google Apps Script & Serverless Backends

* **Method:** `POST` (Google Apps Script web apps reject JSON bodies via `GET`).
* **Content-Type:** Use `text/plain;charset=utf-8` to avoid browser CORS preflight (`OPTIONS` request) failures with Google Apps Script redirects.
* **Redirects:** Always set `redirect: "follow"` in `fetch()` calls.

---

## 2. Testing Workflows

### A. Testing via Fetch / MCP
When using the Fetch MCP server or local scripts, test endpoints with exact payloads:
```bash
# Example payload test using curl or fetch tool
curl -L -X POST "https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec" \
  -H "Content-Type: text/plain;charset=utf-8" \
  -d '{"action":"login","volunteerId":"VOL-001","pin":"1234"}'
```

### B. Payload Validation Checklist
Ensure payloads include:
1. `action` string discriminator (e.g., `login`, `scan`, `submit_paper`, `contact_form`).
2. Authentication or session token (e.g., `volunteerId`, `pin`, or API secret).
3. Unique client identifier / idempotency key (`clientScanId` or `submissionId` via UUIDv4).
4. ISO timestamp (`timestamp: new Date().toISOString()`).

### C. Standard Response Handling
Ensure frontend code gracefully handles:
* `SUCCESS`: Data processed; display visual confirmation.
* `DUPLICATE_SCAN` / `ALREADY_SUBMITTED`: Informative non-blocking warning.
* `AUTH_FAILED` / `INVALID_CREDENTIALS`: Prompt re-login.
* `NETWORK_ERROR` / `TIMEOUT`: Queue request in local storage / IndexedDB for automatic background retry.

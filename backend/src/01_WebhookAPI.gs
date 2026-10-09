/**
 * 01_WebhookAPI.gs
 * -------------------------------------------------------------
 * HTTP Gateway & Action Dispatcher for JAI Conclave 2026.
 * Handles GET (health check) and POST (login, scan, bulkSync).
 * -------------------------------------------------------------
 */

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "OK", message: "JAI Conclave 2026 API is running." })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let hasLock = false;
  
  const jsonResponse = (obj) => {
    return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  };

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, status: "ERROR", message: "No data received" });
    }
    
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    
    // Read-only / Quick actions that do not require script write lock
    if (action === "login") {
      return jsonResponse(handleLogin(body));
    } else if (action === "getDashboardStats") {
      return jsonResponse(handleDashboardStats(body));
    } else if (action === "getVolunteerDevices") {
      return jsonResponse(handleVolunteerDeviceList(body));
    } else if (action === "flushCache") {
      const auth = authenticate(body.volunteerId, body.pin, body.deviceId);
      if (!auth.ok || auth.assignedCheckpoints !== "ALL") {
        return jsonResponse({ success: false, status: "AUTH_FAILED", message: "Admin privileges required." });
      }
      const msg = flushAuthCache();
      return jsonResponse({ success: true, message: msg });
    }
    
    // Acquire write lock for scan, bulkSync, and unlock actions (10s max wait)
    if (!lock.tryLock(10000)) {
      return jsonResponse({ success: false, status: "TIMEOUT", message: "Server busy, please retry." });
    }
    hasLock = true;
    
    if (action === "scan") {
      return jsonResponse(handleScan(body));
    } else if (action === "bulkSync") {
      return jsonResponse(handleBulkSync(body));
    } else if (action === "unlockVolunteerDevice") {
      return jsonResponse(handleUnlockVolunteerDevice(body));
    } else {
      return jsonResponse({ success: false, status: "ERROR", message: "Unknown action: " + action });
    }

  } catch (error) {
    return jsonResponse({ success: false, status: "ERROR", message: error.toString() });
  } finally {
    if (hasLock) {
      try { lock.releaseLock(); } catch(e) {}
    }
  }
}

/**
 * JAI Conclave 2026 - Email & Batch Pass Dispatch Service
 * File: EmailService.gs
 * -------------------------------------------------------------
 * Provides coordinated, quota-safe batching (default: 100 emails/day)
 * for QR generation + Digital ID Pass delivery.
 * -------------------------------------------------------------
 */

/**
 * UNIFIED BATCH DISPATCHER (100 Passes/Day Engine)
 * - Automatically assigns sequential IDs if missing.
 * - Dynamically generates QR codes if not already created in Drive.
 * - Falls back to the QR code image if a custom graphic ID card is not uploaded.
 * - Enforces daily quota caps (e.g. 100/day) to protect Gmail deliverability and reputation.
 * - Records timestamps, delivery statuses, and execution reports in 05_Automation_Log.
 */
function batchProcessAndDispatch(customLimit) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    logAutomation("Batch Pass Dispatch", 0, "Failed", "Could not acquire script lock.");
    showAlert("Server Busy", "Another process is running. Please retry in a few seconds.");
    return;
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName("00_Configuration");
    const masterSheet = ss.getSheetByName("01_Participants_Master");
    const opSheet = ss.getSheetByName("02_Operational_State");

    if (!configSheet || !masterSheet || !opSheet) {
      logAutomation("Batch Pass Dispatch", 0, "Failed", "Required sheets missing.");
      return;
    }

    // 1. Read Configuration & Daily Tracking Counters
    const configData = configSheet.getRange("A2:B15").getValues();
    let dailyLimit = 100;
    let sentToday = 0;
    let lastDispatchDate = "";
    let qrFolderId = "";
    let idCardFolderId = "";

    let dailyLimitRow = -1;
    let sentTodayRow = -1;
    let lastDateRow = -1;

    for (let i = 0; i < configData.length; i++) {
      const key = String(configData[i][0]).trim();
      const val = String(configData[i][1]).trim();
      const rowNum = i + 2;

      if (key === "Daily_Email_Limit") { dailyLimit = parseInt(val) || 100; dailyLimitRow = rowNum; }
      if (key === "Daily_Emails_Sent_Today") { sentToday = parseInt(val) || 0; sentTodayRow = rowNum; }
      if (key === "Last_Email_Dispatch_Date") { lastDispatchDate = val; lastDateRow = rowNum; }
      if (key === "QR_Folder_ID") qrFolderId = val;
      if (key === "ID_Card_Folder_ID") idCardFolderId = val;
    }

    if (customLimit && typeof customLimit === "number") {
      dailyLimit = customLimit;
    }

    // Auto-create tracking rows in 00_Configuration if they don't exist
    const lastConfigRow = configSheet.getLastRow();
    if (dailyLimitRow === -1) {
      configSheet.getRange(lastConfigRow + 1, 1, 1, 2).setValues([["Daily_Email_Limit", dailyLimit]]);
    }
    if (sentTodayRow === -1) {
      configSheet.getRange(lastConfigRow + 2, 1, 1, 2).setValues([["Daily_Emails_Sent_Today", 0]]);
      sentTodayRow = lastConfigRow + 2;
    }
    if (lastDateRow === -1) {
      configSheet.getRange(lastConfigRow + 3, 1, 1, 2).setValues([["Last_Email_Dispatch_Date", ""]]);
      lastDateRow = lastConfigRow + 3;
    }

    // 2. Date Rollover Check (Asia/Kolkata timezone)
    const todayStr = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd");
    if (lastDispatchDate !== todayStr) {
      sentToday = 0;
      lastDispatchDate = todayStr;
      if (sentTodayRow > 0) configSheet.getRange(sentTodayRow, 2).setValue(0);
      if (lastDateRow > 0) configSheet.getRange(lastDateRow, 2).setValue(todayStr);
    }

    const remainingAllowedToday = Math.max(0, dailyLimit - sentToday);
    if (remainingAllowedToday <= 0) {
      const msg = `Today's batch limit of ${dailyLimit} passes has already been reached (${sentToday} sent today on ${todayStr}).\n\nTo send another batch today, select "JAI Conclave > 🔄 Reset Daily Dispatch Counter" from the menu.`;
      logAutomation("Batch Pass Dispatch", 0, "Daily Limit Reached", msg);
      showAlert("Daily Dispatch Limit Reached", msg);
      return;
    }

    // 3. Check Google's Remaining Daily Quota
    const remainingGoogleQuota = MailApp.getRemainingDailyQuota();
    if (remainingGoogleQuota < 5) {
      const msg = `Google daily email quota exhausted (${remainingGoogleQuota} remaining). Please wait for Google's 24-hour quota reset.`;
      logAutomation("Batch Pass Dispatch", 0, "Failed", msg);
      showAlert("Google Quota Exhausted", msg);
      return;
    }

    const batchSizeToRun = Math.min(remainingAllowedToday, remainingGoogleQuota);

    // 4. Access QR Folder
    let qrFolder = null;
    if (qrFolderId && qrFolderId !== "[INSERT_ID]") {
      try {
        qrFolder = DriveApp.getFolderById(qrFolderId);
      } catch (e) {
        Logger.log("Warning: Could not access QR Folder: " + e.toString());
      }
    }

    // 5. Read Master & Operational Sheets
    const opLastRow = opSheet.getLastRow();
    if (opLastRow < 2) {
      showAlert("No Participants", "No participants found in database.");
      return;
    }

    const masterData = masterSheet.getRange(2, 1, opLastRow - 1, 12).getValues();
    const opData = opSheet.getRange(2, 1, opLastRow - 1, 10).getValues();
    // Col 0: ID, Col 5: QR_Drive_URL, Col 6: ID_Card_URL, Col 7: Sent_At, Col 8: Status, Col 9: Retries

    let sentInThisRun = 0;
    let errorsInThisRun = 0;
    let qrGeneratedInThisRun = 0;
    const opUpdates = []; // Rows for Cols F:J (Cols 6:10)

    for (let i = 0; i < opData.length; i++) {
      let pId = String(opData[i][0]).trim();
      let qrUrl = String(opData[i][5]).trim();
      let idCardUrl = String(opData[i][6]).trim();
      let emailStatus = String(opData[i][8]).trim();
      let retryCount = parseInt(opData[i][9]) || 0;

      let rowUpdate = [opData[i][5], opData[i][6], opData[i][7], opData[i][8], opData[i][9]];

      // Stop once batch target reached
      if (sentInThisRun >= batchSizeToRun) {
        opUpdates.push(rowUpdate);
        continue;
      }

      // Target criteria: Has participant ID, not marked Success, retry count < 3
      if (pId && emailStatus !== "Success" && retryCount < 3) {
        const name = String(masterData[i][1]).trim();
        const email = String(masterData[i][2]).trim();
        const track = String(masterData[i][5]).trim() || "Delegate";

        if (!email) {
          opUpdates.push(rowUpdate);
          continue;
        }

        try {
          // A. Auto-Generate QR Code if missing
          let qrFile = null;
          if (!qrUrl && qrFolder) {
            const expectedName = `${pId}.png`;
            const existing = qrFolder.getFilesByName(expectedName);
            if (existing.hasNext()) {
              qrFile = existing.next();
              qrUrl = qrFile.getUrl();
            } else {
              const apiUrl = `https://quickchart.io/qr?text=${encodeURIComponent(pId)}&ecLevel=L&size=600&margin=2`;
              const response = UrlFetchApp.fetch(apiUrl, { muteHttpExceptions: true });
              if (response.getResponseCode() === 200) {
                const blob = response.getBlob().setName(expectedName);
                qrFile = qrFolder.createFile(blob);
                qrFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                qrUrl = qrFile.getUrl();
                qrGeneratedInThisRun++;
              }
            }
          }

          // B. Resolve Pass Image: Prefer designed ID Card (Col G), fallback to QR (Col F)
          let passImageBlob = null;
          if (idCardUrl) {
            const cardMatch = idCardUrl.match(/[-\w]{25,}/);
            if (cardMatch) {
              passImageBlob = DriveApp.getFileById(cardMatch[0]).getBlob().setName(`${pId}_Pass.png`);
            }
          }

          if (!passImageBlob && qrUrl) {
            const qrMatch = qrUrl.match(/[-\w]{25,}/);
            if (qrMatch) {
              passImageBlob = DriveApp.getFileById(qrMatch[0]).getBlob().setName(`${pId}_QR_Pass.png`);
            } else if (qrFile) {
              passImageBlob = qrFile.getBlob().setName(`${pId}_QR_Pass.png`);
            }
          }

          if (!passImageBlob) {
            throw new Error("Neither ID Card graphic nor QR Code file available to attach.");
          }

          // C. Build Personalized Pass Template
          const template = HtmlService.createTemplateFromFile('IDCardEmailTemplate');
          template.name = name;
          template.participantId = pId;
          template.track = track;
          const htmlBody = template.evaluate().getContent();

          // D. Dispatch Email with Inline Image
          MailApp.sendEmail({
            to: email,
            subject: `Official Entry Pass: JAI Conclave 2026 [${pId}]`,
            htmlBody: htmlBody,
            inlineImages: { idCardImage: passImageBlob }
          });

          // E. Record Success
          rowUpdate = [qrUrl, idCardUrl, new Date(), "Success", retryCount];
          sentInThisRun++;

        } catch (e) {
          Logger.log(`Dispatch failed for ${pId}: ${e.toString()}`);
          rowUpdate = [qrUrl, idCardUrl, new Date(), "Failed", retryCount + 1];
          errorsInThisRun++;
        }
      }

      opUpdates.push(rowUpdate);
    }

    // 6. Atomic Batch Write to 02_Operational_State (Cols F to J: Cols 6 to 10)
    if (opUpdates.length > 0) {
      opSheet.getRange(2, 6, opUpdates.length, 5).setValues(opUpdates);
    }

    // 7. Update Daily Counter in 00_Configuration
    const newSentToday = sentToday + sentInThisRun;
    if (sentTodayRow > 0) {
      configSheet.getRange(sentTodayRow, 2).setValue(newSentToday);
    }

    // 8. Log Automation Event
    const statusReport = `Dispatched: ${sentInThisRun} | QRs Created: ${qrGeneratedInThisRun} | Errors: ${errorsInThisRun} | Today's Total: ${newSentToday}/${dailyLimit} | Gmail Quota Remaining: ${MailApp.getRemainingDailyQuota()}`;
    const automationStatus = errorsInThisRun > 0 ? "Partial Success" : (sentInThisRun > 0 ? "Success" : "Idle");
    logAutomation("Batch Pass Dispatch", sentInThisRun, automationStatus, statusReport);

    showAlert("Batch Dispatch Report", 
      `🎉 Batch Run Complete!\n\n` +
      `• Passes Emailed: ${sentInThisRun}\n` +
      `• New QRs Minted: ${qrGeneratedInThisRun}\n` +
      `• Failures: ${errorsInThisRun}\n\n` +
      `📊 Daily Quota Status:\n` +
      `• Dispatched Today: ${newSentToday} / ${dailyLimit}\n` +
      `• Google Daily Quota Remaining: ${MailApp.getRemainingDailyQuota()}`
    );

  } catch (error) {
    logAutomation("Batch Pass Dispatch", 0, "Failed", error.toString());
    showAlert("Dispatch Error", error.toString());
  } finally {
    lock.releaseLock();
  }
}

/**
 * Reset today's dispatch counter so the admin can trigger another batch today.
 */
function resetDailyEmailCounter() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName("00_Configuration");
  if (!configSheet) return;

  const data = configSheet.getRange("A2:B20").getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === "Daily_Emails_Sent_Today") {
      configSheet.getRange(i + 2, 2).setValue(0);
      showAlert("Counter Reset", "Today's email counter has been reset to 0. You can now dispatch another batch.");
      return;
    }
  }
  showAlert("Notice", "Daily_Emails_Sent_Today counter variable not found in 00_Configuration.");
}

/**
 * Scheduled cron runner for daily automated dispatch (e.g. 10:00 AM daily trigger)
 */
function runDailyScheduledBatch() {
  batchProcessAndDispatch(100);
}

/**
 * Sets up a recurring daily trigger to run at 10:00 AM automatically.
 */
function setupDailyEmailTrigger() {
  // Remove existing triggers for this function to prevent duplicate dispatches
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === "runDailyScheduledBatch") {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger("runDailyScheduledBatch")
    .timeBased()
    .everyDays(1)
    .atHour(10)
    .inTimezone("Asia/Kolkata")
    .create();

  showAlert("Daily Trigger Installed", "Daily pass dispatch trigger installed!\n\nThe system will automatically process up to 100 passes every morning between 10:00 AM - 11:00 AM.");
}

/**
 * Legacy dispatch function maintained for backward compatibility.
 */
function dispatchIDCardEmails() {
  batchProcessAndDispatch(50);
}

/**
 * Maps custom-designed graphic badge files from Google Drive to participants.
 */
function mapIDCardsAndRunQA() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName("00_Configuration");
  const masterSheet = ss.getSheetByName("01_Participants_Master");
  const opSheet = ss.getSheetByName("02_Operational_State");
  
  const configData = configSheet.getRange("A2:B").getValues();
  let folderId = "";
  for (let i = 0; i < configData.length; i++) {
    if (configData[i][0] === "ID_Card_Folder_ID") folderId = String(configData[i][1]).trim();
  }
  
  if (!folderId || folderId === "[INSERT_ID]") {
    logAutomation("QA & Mapping", 0, "Failed", "ID_Card_Folder_ID missing in Configuration.");
    showAlert("Configuration Error", "ID_Card_Folder_ID is missing or not configured in 00_Configuration.");
    return;
  }
  
  let folder;
  try {
    folder = DriveApp.getFolderById(folderId);
  } catch (e) {
    showAlert("Folder Error", "Cannot access ID Cards folder. Check permissions and ID.");
    return;
  }

  const files = folder.getFiles();
  const driveCards = {}; 
  const duplicateFiles = [];
  
  while (files.hasNext()) {
    const file = files.next();
    const fileName = file.getName();
    const match = fileName.match(/(JAI-\d{2}-\d{6})/i); 
    
    if (match) {
      const pId = match[1].toUpperCase();
      if (driveCards[pId]) {
        duplicateFiles.push(fileName);
      } else {
        driveCards[pId] = { id: file.getId(), url: file.getUrl(), name: fileName };
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }
    }
  }
  
  const lastRow = masterSheet.getLastRow();
  if (lastRow < 2) return;
  
  const masterData = masterSheet.getRange(2, 1, lastRow - 1, 6).getValues();
  const opData = opSheet.getRange(2, 1, lastRow - 1, 7).getValues();
  
  let missingCards = [];
  let missingEmails = [];
  let mappedCount = 0;
  const urlUpdates = [];
  const dbParticipantIds = new Set();
  
  for (let i = 0; i < masterData.length; i++) {
    const pId = String(masterData[i][0]).trim();
    const email = String(masterData[i][2]).trim();
    let currentCardUrl = String(opData[i][6]).trim();
    
    if (!pId) {
      urlUpdates.push([currentCardUrl]);
      continue;
    }
    
    dbParticipantIds.add(pId);
    if (!email) missingEmails.push(pId);
    
    if (driveCards[pId]) {
      urlUpdates.push([driveCards[pId].url]);
      mappedCount++;
    } else {
      urlUpdates.push([currentCardUrl]);
      missingCards.push(pId);
    }
  }
  
  let orphanedCards = Object.keys(driveCards).filter(id => !dbParticipantIds.has(id));
  
  if (urlUpdates.length > 0) {
    opSheet.getRange(2, 7, urlUpdates.length, 1).setValues(urlUpdates);
  }
  
  let report = `Mapped ${mappedCount} ID cards.\n\n--- QA REPORT ---\n`;
  report += `Missing Emails: ${missingEmails.length}\n`;
  report += `Missing ID Cards: ${missingCards.length}\n`;
  report += `Orphaned Cards (No DB Match): ${orphanedCards.length}\n`;
  report += `Duplicate Files in Drive: ${duplicateFiles.length}\n`;
  
  if (missingEmails.length > 0) report += `\nSample Missing Emails: ${missingEmails.slice(0, 5).join(", ")}`;
  if (missingCards.length > 0) report += `\nSample Missing Cards: ${missingCards.slice(0, 5).join(", ")}`;
  
  logAutomation("QA & Mapping", mappedCount, (missingCards.length > 0 || missingEmails.length > 0) ? "Partial Success" : "Success", report);
  showAlert("QA & ID Card Mapping Complete", report);
}

/**
 * UI Alert helper that falls back to Logger when run from background triggers.
 */
function showAlert(title, message) {
  try {
    SpreadsheetApp.getUi().alert(title, message, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    Logger.log(`[${title}] ${message}`);
  }
}

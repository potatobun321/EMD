/**
 * ============================================================================
 * VISHWAM — THE GLOBAL DIALOGUE FORUM
 * Unified Webhook & Master Database Handler (Google Apps Script)
 * ============================================================================
 * 
 * Supports 4 Unified Streams:
 * 1. Students & Scholars (VSH-STU-*)
 * 2. Academic Institutions (VSH-INS-*)
 * 3. Partner Organizations (VSH-ORG-*)
 * 4. General Inquiries & Media (VSH-GEN-*)
 */

const VISHWAM_CONFIG = {
  MASTER_SHEET_NAME: "All Submissions",
  STUDENTS_SHEET_NAME: "Students and Scholars",
  INSTITUTIONS_SHEET_NAME: "Academic Institutions",
  ORGS_SHEET_NAME: "Organizations and Partners",
  GENERAL_SHEET_NAME: "General Inquiries",
  OFFICIAL_EMAIL: "vishwamspeaks@gmail.com",
  BRAND_NAME: "VISHWAM – The Global Dialogue Forum"
};

/**
 * HTTP GET Handler (Status check & One-click initialization)
 */
function doGet(e) {
  setupJoinSpreadsheet();
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "VISHWAM Webhook is live and sheets are synchronized.",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * HTTP POST Handler for Webhook Submissions
 */
function doPost(e) {
  try {
    const rawData = e.postData ? e.postData.contents : null;
    if (!rawData) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "No payload received"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const payload = JSON.parse(rawData);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Ensure sheets exist
    let masterSheet = ss.getSheetByName(VISHWAM_CONFIG.MASTER_SHEET_NAME);
    if (!masterSheet) {
      setupJoinSpreadsheet();
      masterSheet = ss.getSheetByName(VISHWAM_CONFIG.MASTER_SHEET_NAME);
    }

    const timestamp = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy, HH:mm:ss");
    const refCode = payload.refCode || ("VSH-" + Utilities.getUuid().substring(0, 8).toUpperCase());
    const track = (payload.track || "student").toLowerCase();
    const applicantName = payload.applicantName || "";
    const applicantEmail = payload.applicantEmail || "";
    const applicantPhone = payload.applicantPhone || "";
    const applicantLocation = payload.applicantLocation || "";
    const entityName = payload.entityName || "";
    const designationOrYear = payload.designationOrYear || "";
    const interestOrSynergy = payload.interestOrSynergy || "";
    const websiteOrProfile = payload.websiteOrProfile || "";
    const statementOrProposal = payload.statementOrProposal || "";
    const status = "Pending Review";
    const reviewerNotes = "";

    const rowData = [
      timestamp,
      refCode,
      formatTrackLabel(track),
      applicantName,
      applicantEmail,
      applicantPhone,
      applicantLocation,
      entityName,
      designationOrYear,
      interestOrSynergy,
      websiteOrProfile,
      statementOrProposal,
      status,
      reviewerNotes
    ];

    // Append to Master Sheet
    masterSheet.appendRow(rowData);

    // Append to Track Specific Sheet
    let specificSheetName = VISHWAM_CONFIG.STUDENTS_SHEET_NAME;
    if (track === "institution") specificSheetName = VISHWAM_CONFIG.INSTITUTIONS_SHEET_NAME;
    else if (track === "organization") specificSheetName = VISHWAM_CONFIG.ORGS_SHEET_NAME;
    else if (track === "general") specificSheetName = VISHWAM_CONFIG.GENERAL_SHEET_NAME;

    const specificSheet = ss.getSheetByName(specificSheetName);
    if (specificSheet) {
      specificSheet.appendRow(rowData);
    }

    // Send Automated Confirmation Email
    if (applicantEmail && applicantEmail.includes("@")) {
      sendConfirmationEmail(applicantName, applicantEmail, refCode, track, entityName);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      refCode: refCode,
      message: "Submission logged successfully"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function formatTrackLabel(track) {
  if (track === "institution") return "Academic Institution";
  if (track === "organization") return "Partner Organization";
  if (track === "general") return "General Inquiry";
  return "Student and Scholar";
}

/**
 * Sends a clean, branded confirmation email to applicant
 */
function sendConfirmationEmail(name, email, refCode, track, entityName) {
  try {
    const trackLabel = formatTrackLabel(track);
    const subject = `[${refCode}] Registration Acknowledgment – VISHWAM Dialogue Platform`;
    const htmlBody = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #0b192c;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1.5px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(11,25,44,0.06);">
          
          <div style="background: #0b192c; padding: 24px; text-align: center; border-bottom: 4px solid #ea580c;">
            <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: 0.05em;">VISHWAM</h1>
            <p style="color: #ea580c; font-size: 13px; margin: 6px 0 0 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;">The Global Dialogue Forum</p>
          </div>

          <div style="padding: 28px 24px;">
            <h2 style="font-size: 18px; color: #0b192c; margin-top: 0;">Dear ${name},</h2>
            <p style="font-size: 15px; line-height: 1.7; color: #334155;">
              Thank you for connecting with <strong>VISHWAM – The Global Dialogue Forum</strong> under the <strong>${trackLabel}</strong> track.
            </p>

            <div style="background: #f1f5f9; border-left: 4px solid #ea580c; border-radius: 6px; padding: 14px 18px; margin: 20px 0;">
              <div style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700;">Registration Reference Code</div>
              <div style="font-size: 18px; font-weight: 800; color: #ea580c; letter-spacing: 0.05em; margin-top: 4px;">${refCode}</div>
              <div style="font-size: 13px; color: #475569; margin-top: 4px;">Affiliation: ${entityName || 'Individual Application'}</div>
            </div>

            <p style="font-size: 14px; line-height: 1.7; color: #475569;">
              Our Secretariat and Review Desk are reviewing your submission. A representative will connect with you shortly with further details.
            </p>

            <div style="margin-top: 28px; padding-top: 18px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
              Warm regards,<br>
              <strong style="color: #0b192c;">Secretariat and Engagement Desk</strong><br>
              VISHWAM – The Global Dialogue Forum<br>
              <em>In Dialogue, We Discover Destiny.</em>
            </div>
          </div>

        </div>
      </div>
    `;

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
  } catch (e) {
    Logger.log("Email dispatch warning: " + e.toString());
  }
}

/**
 * Setup and format all sheets with elegant, clean headers without slashes
 */
function setupJoinSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = [
    VISHWAM_CONFIG.MASTER_SHEET_NAME,
    VISHWAM_CONFIG.STUDENTS_SHEET_NAME,
    VISHWAM_CONFIG.INSTITUTIONS_SHEET_NAME,
    VISHWAM_CONFIG.ORGS_SHEET_NAME,
    VISHWAM_CONFIG.GENERAL_SHEET_NAME
  ];

  const headers = [
    "Timestamp",
    "Registration ID",
    "Category Track",
    "Applicant Name",
    "Email Address",
    "Contact Number",
    "City and State",
    "Affiliation Entity",
    "Role or Academic Year",
    "Engagement Track",
    "Official Link",
    "Executive Statement",
    "Status",
    "Reviewer Notes"
  ];

  sheets.forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Set headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format Header Row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#0b192c");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Segoe UI");
    headerRange.setFontSize(10);
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");
    sheet.setRowHeight(1, 38);
    sheet.setFrozenRows(1);

    // Auto-fit column widths
    for (let c = 1; c <= headers.length; c++) {
      sheet.autoResizeColumn(c);
    }
  });

  SpreadsheetApp.flush();
}

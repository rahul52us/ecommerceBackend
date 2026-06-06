import PDFDocument from "pdfkit";

const calculateAge = (dob: any) => {
  if (!dob) return "";
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * GENERATE FULL PATIENT ACCOUNT STATEMENT PDF
 * Preserved your original logic completely.
 */
export const generateStatementPDF = (data: any, stream: any) => {
  const { patient, clinic, records } = data;
  const doc = new PDFDocument({
    margin: 0,
    size: "A4",
    bufferPages: true
  });

  doc.pipe(stream);

  // --- STYLE TOKENS ---
  const COLORS = {
    brand: "#1e3a8a",
    brandLight: "#3b82f6",
    textMain: "#111827",
    textMuted: "#4b5563",
    bgLight: "#f8fafc",
    zebra: "#f1f5f9",
    success: "#059669",
    danger: "#dc2626",
    border: "#e2e8f0",
    white: "#ffffff"
  };

  // --- DIMENSIONS ---
  const PAGE_WIDTH = 595.28;
  const MARGIN = 20;
  const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

  // --- HELPER: PREMIUM CARD ---
  const drawCompactCard = (x: number, y: number, w: number, h: number, label: string, value: string, color: string) => {
    doc.save();
    doc.fillColor(COLORS.bgLight).roundedRect(x, y, w, h, 8).fill();
    doc.lineWidth(0.5).strokeColor(COLORS.border).roundedRect(x, y, w, h, 8).stroke();

    doc.fillColor(color).circle(x + 12, y + 16, 2.5).fill();

    doc.fillColor(COLORS.textMuted).fontSize(7).font("Helvetica-Bold").text(label, x + 22, y + 12);
    doc.fillColor(COLORS.textMain).fontSize(12).font("Helvetica-Bold").text(value, x + 22, y + 24);
    doc.restore();
  };

  // --- COMPACT HEADER ---
  const headerHeight = 110;
  doc.rect(0, 0, PAGE_WIDTH, headerHeight).fill(COLORS.brand);

  // Clinic Info (Left Side) - Using company_name from schema
  doc
    .fillColor(COLORS.white)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(clinic?.company_name?.toUpperCase() || "DENTAL CLINIC", MARGIN, 25)
    .fontSize(8.5)
    .font("Helvetica")
    .opacity(0.8)
    .text(`${clinic?.addressInfo?.[0]?.address || ""} | ${clinic?.addressInfo?.[0]?.city || ""}`, MARGIN, 52)
    .text(`Phone: ${clinic?.mobileNo || "N/A"} | Email: ${clinic?.email || "N/A"}`, MARGIN, 65);

  // Statement & Patient Info (Right Side)
  const rightAlignX = PAGE_WIDTH - MARGIN - 250;
  doc
    .fillColor(COLORS.white)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text("ACCOUNT STATEMENT", rightAlignX, 25, { align: "right", width: 250 })
    .opacity(0.8)
    .fontSize(10)
    .text(patient?.name?.toUpperCase() || "N/A", rightAlignX, 48, { align: "right", width: 250 })
    .fontSize(8.5)
    .font("Helvetica")
    .text(`Patient ID: ${patient?.code || "N/A"} | Mob: ${patient?.mobileNumber || "N/A"}`, rightAlignX, 65, { align: "right", width: 250 })
    .text(`Generated On: ${new Date().toLocaleDateString('en-IN')}`, rightAlignX, 78, { align: "right", width: 250 });

  // --- SUMMARY CARDS ---
  const contentY = 125;
  const totalBilled = records.reduce((sum: number, r: any) => sum + (r.amount - (r.discount || 0)), 0);
  const totalPaid = records.reduce((sum: number, r: any) => sum + (r.receivedAmount || 0), 0);
  const balance = totalBilled - totalPaid;

  const cardGap = 12;
  const cardW = (CONTENT_WIDTH - (cardGap * 2)) / 3;
  const cardH = 45;

  drawCompactCard(MARGIN, contentY, cardW, cardH, "TOTAL BILLED", `Rs. ${totalBilled.toLocaleString()}`, COLORS.brandLight);
  drawCompactCard(MARGIN + cardW + cardGap, contentY, cardW, cardH, "TOTAL PAID", `Rs. ${totalPaid.toLocaleString()}`, COLORS.success);
  drawCompactCard(MARGIN + (cardW + cardGap) * 2, contentY, cardW, cardH, "BALANCE DUE", `Rs. ${balance.toLocaleString()}`, COLORS.danger);

  // --- PREMIUM TABLE SECTION ---
  const tableTop = 185;
  const rowH = 28;
  const headerH = 26;

  doc.save();
  doc.fillColor(COLORS.brand).roundedRect(MARGIN, tableTop, CONTENT_WIDTH, headerH, 6).fill();

  // Rebalanced Column Widths
  const colX = {
    date: MARGIN + 10,
    tooth: MARGIN + 70,
    treatment: MARGIN + 110,
    doctor: MARGIN + 280,
    fees: MARGIN + 385,
    paid: MARGIN + 445,
    status: MARGIN + 500
  };

  doc
    .fillColor(COLORS.white)
    .fontSize(8)
    .font("Helvetica-Bold")
    .text("DATE", colX.date, tableTop + 9)
    .text("TOOTH", colX.tooth, tableTop + 9)
    .text("TREATMENT / PROCEDURE", colX.treatment, tableTop + 9)
    .text("DOCTOR", colX.doctor, tableTop + 9)
    .text("FEES", colX.fees, tableTop + 9, { width: 50, align: "right" })
    .text("PAID", colX.paid, tableTop + 9, { width: 50, align: "right" })
    .text("STATUS", colX.status, tableTop + 9, { width: 45, align: "center" });
  doc.restore();

  let y = tableTop + headerH;
  let rowCount = 0;

  records.forEach((record: any) => {
    // Zebra Striping
    if (rowCount % 2 !== 0) {
      doc.fillColor(COLORS.zebra).rect(MARGIN, y, CONTENT_WIDTH, rowH).fill();
    }

    // Bottom Border
    doc.lineWidth(0.2).strokeColor(COLORS.border).moveTo(MARGIN, y + rowH).lineTo(MARGIN + CONTENT_WIDTH, y + rowH).stroke();

    const date = new Date(record.createdAt).toLocaleDateString('en-IN');
    const treatment = (record.treatment as any)?.treatmentName || record.workDoneNote || record.treatmentCode || "General Procedure";
    const toothStr = record.tooth || "N/A";
    const doctor = (record.doctor as any)?.name || "N/A";
    const bill = record.amount - (record.discount || 0);
    const paid = record.receivedAmount || 0;
    const isSettled = paid >= bill;

    // Data Row
    doc
      .fillColor(COLORS.textMain)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text(date, colX.date, y + 9)
      .font("Helvetica")
      .text(toothStr, colX.tooth, y + 9, { width: 35, height: 12, ellipsis: true })
      .text(treatment, colX.treatment, y + 9, { width: 160, height: 12, ellipsis: true })
      .fillColor(COLORS.textMuted)
      .text(doctor, colX.doctor, y + 9, { width: 100, height: 12, ellipsis: true })
      .fillColor(COLORS.textMain)
      .font("Helvetica-Bold")
      .text(bill.toLocaleString(), colX.fees, y + 9, { width: 50, align: "right" })
      .text(paid.toLocaleString(), colX.paid, y + 9, { width: 50, align: "right" });

    // Status Badge
    const badgeW = 40;
    const badgeH = 13;
    const badgeX = colX.status + (45 - badgeW) / 2;
    const badgeY = y + 7.5;

    doc.save();
    doc.fillColor(isSettled ? COLORS.success : COLORS.danger).roundedRect(badgeX, badgeY, badgeW, badgeH, 3).fill();
    doc.fillColor(COLORS.white).fontSize(6).font("Helvetica-Bold").text(isSettled ? "SETTLED" : "DUE", badgeX, badgeY + 4, { width: badgeW, align: "center" });
    doc.restore();

    y += rowH;
    rowCount++;

    // New Page Logic
    if (y > 770) {
      doc.addPage({ margin: 0 });
      y = 40;
      doc.fillColor(COLORS.brand).roundedRect(MARGIN, y, CONTENT_WIDTH, 20, 4).fill();
      doc.fillColor(COLORS.white).fontSize(8).font("Helvetica-Bold").text("CONTINUED STATEMENT...", colX.date, y + 6);
      y += 24;
    }
  });

  // --- FOOTER ---
  const footerY = 795;
  doc.lineWidth(0.5).strokeColor(COLORS.border).moveTo(MARGIN, footerY).lineTo(MARGIN + CONTENT_WIDTH, footerY).stroke();

  doc
    .fillColor(COLORS.textMuted)
    .fontSize(7)
    .font("Helvetica")
    .text(`Statement generated by ${clinic?.company_name || "Clinic System"}`, MARGIN, footerY + 10, { align: "left" })
    .text(`Page Count: ${doc.bufferedPageRange().count}`, PAGE_WIDTH - MARGIN - 100, footerY + 10, { align: "right", width: 100 });

  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(COLORS.textMuted).fontSize(7).text(`Page ${i + 1} of ${pages.count}`, 0, 815, { align: "center", width: PAGE_WIDTH });
  }

  doc.end();
};

/**
 * GENERATE SINGLE TREATMENT RECEIPT PDF
 * New separate PDF logic for row-level downloads.
 */
export const generateSingleRecordPDF = (data: any, stream: any) => {
  const { patient, clinic, records } = data;
  const record = records[0];

  const doc = new PDFDocument({
    margin: 0,
    size: "A4",
    bufferPages: true
  });

  doc.pipe(stream);

  const COLORS = {
    brand: "#1e3a8a",
    brandLight: "#3b82f6",
    textMain: "#111827",
    textMuted: "#4b5563",
    bgLight: "#f8fafc",
    success: "#059669",
    danger: "#dc2626",
    border: "#e2e8f0",
    white: "#ffffff"
  };

  const PAGE_WIDTH = 595.28;
  const MARGIN = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

  // --- HEADER ---
  doc.rect(0, 0, PAGE_WIDTH, 140).fill(COLORS.brand);
  doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(24).text("TREATMENT RECEIPT", MARGIN, 35);
  doc.fontSize(10).opacity(0.8).text(`Date: ${new Date().toLocaleDateString()}`, MARGIN, 65);
  doc.fontSize(10).text(`Receipt No: ${data.receiptNumber || "N/A"}`, MARGIN, 80);

  // Clinic Info (Top Right)
  doc.opacity(1).fontSize(14).text(clinic?.company_name?.toUpperCase() || "DENTAL CLINIC", PAGE_WIDTH - MARGIN - 200, 40, { align: "right", width: 200 });
  doc.fontSize(9).font("Helvetica").opacity(0.8).text(clinic?.addressInfo?.[0]?.address || "", PAGE_WIDTH - MARGIN - 200, 60, { align: "right", width: 200 });

  // --- PATIENT CARD ---
  let y = 160;

  const pInfo = patient?.profile_details?.personalInfo || {};
  let ageStr = "";
  if (pInfo.dob) {
    const ageDiffMs = Date.now() - new Date(pInfo.dob).getTime();
    if (ageDiffMs > 0) {
      const ageDate = new Date(ageDiffMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age > 0) ageStr = `${age}Y`;
    }
  }

  let sexStr = "";
  if (pInfo.gender === 1) sexStr = "Male";
  else if (pInfo.gender === 2) sexStr = "Female";
  else if (pInfo.gender === 3) sexStr = "Other";

  const addressObj = pInfo.addresses || {};
  const address = addressObj.residential || addressObj.office || addressObj.other || "";

  const title = pInfo.title ? (pInfo.title.label || pInfo.title) : "";
  const fullName = `${title ? title + " " : ""}${patient?.name || "N/A"}`.trim();

  const metaArr = [];
  if (patient?.mobileNumber) metaArr.push(`Mob: ${patient.mobileNumber}`);
  if (ageStr) metaArr.push(`Age: ${ageStr}`);
  if (sexStr) metaArr.push(`Sex: ${sexStr}`);

  const cardHeight = address ? 100 : 80;
  doc.fillColor(COLORS.bgLight).roundedRect(MARGIN, y, CONTENT_WIDTH, cardHeight, 10).fill();
  doc.lineWidth(0.5).strokeColor(COLORS.border).roundedRect(MARGIN, y, CONTENT_WIDTH, cardHeight, 10).stroke();

  doc.fillColor(COLORS.textMuted).fontSize(8).font("Helvetica-Bold").text("PATIENT DETAILS", MARGIN + 20, y + 12);
  doc.fillColor(COLORS.textMain).fontSize(16).text(fullName, MARGIN + 20, y + 25);
  doc.fillColor(COLORS.textMuted).fontSize(9).font("Helvetica").text(metaArr.join("  |  "), MARGIN + 20, y + 48);
  if (address) {
    doc.text(`Address: ${address}`, MARGIN + 20, y + 63, { width: CONTENT_WIDTH - 40 });
  }

  // --- TREATMENT DETAILS ---
  y += cardHeight + 20;

  // Doctor Name
  const doctorName = (record.doctor as any)?.name || "N/A";
  doc.fillColor(COLORS.textMuted).fontSize(8).font("Helvetica-Bold").text("DOCTOR", MARGIN + 15, y);
  y += 12;
  doc.fillColor(COLORS.textMain).fontSize(13).font("Helvetica-Bold").text(`Dr. ${doctorName}`, MARGIN + 15, y);
  y += 35;


  // --- PAYMENT HISTORY ---
  doc.fillColor(COLORS.textMuted).fontSize(8).font("Helvetica-Bold").text("PAYMENT TIMELINE", MARGIN, y);
  y += 15;

  const colX = { date: MARGIN + 10, method: MARGIN + 120, amount: MARGIN + 250 };
  doc.fillColor(COLORS.brand).rect(MARGIN, y, CONTENT_WIDTH, 20).fill();
  doc.fillColor(COLORS.white).fontSize(8).text("DATE", colX.date, y + 6).text("METHOD", colX.method, y + 6).text("AMOUNT", colX.amount, y + 6, { width: 100, align: "right" });
  y += 20;

  const payments = record.paymentHistory || [];
  payments.forEach((p: any, idx: number) => {
    if (idx % 2 !== 0) doc.fillColor(COLORS.bgLight).rect(MARGIN, y, CONTENT_WIDTH, 20).fill();
    doc.fillColor(COLORS.textMain).fontSize(8).font("Helvetica")
      .text(new Date(p.date).toLocaleDateString(), colX.date, y + 6)
      .text(p.paymentMethod || "Cash", colX.method, y + 6)
      .font("Helvetica-Bold").text(`Rs. ${p.amount.toLocaleString()}`, colX.amount, y + 6, { width: 100, align: "right" });
    y += 20;
  });

  // --- FINAL SUMMARY ---
  y += 30;
  const summaryW = 200;
  const summaryX = PAGE_WIDTH - MARGIN - summaryW;

  const bill = record.amount - (record.discount || 0);
  const paid = record.receivedAmount || 0;
  const balance = bill - paid;

  const drawRow = (label: string, value: string, isTotal = false) => {
    doc.fillColor(isTotal ? COLORS.brand : COLORS.textMuted).fontSize(isTotal ? 12 : 9).font(isTotal ? "Helvetica-Bold" : "Helvetica").text(label, summaryX, y);
    doc.text(value, summaryX + 100, y, { align: "right", width: 100 });
    y += isTotal ? 25 : 18;
  };

  drawRow("Gross Amount:", `Rs. ${record.amount.toLocaleString()}`);
  drawRow("Discount:", `Rs. ${(record.discount || 0).toLocaleString()}`);
  doc.lineWidth(0.5).strokeColor(COLORS.border).moveTo(summaryX, y).lineTo(summaryX + 200, y).stroke();
  y += 10;
  drawRow("Total Billed:", `Rs. ${bill.toLocaleString()}`, true);
  drawRow("Total Paid:", `Rs. ${paid.toLocaleString()}`);
  doc.lineWidth(1).strokeColor(COLORS.brand).moveTo(summaryX, y).lineTo(summaryX + 200, y).stroke();
  y += 5;
  drawRow("BALANCE DUE:", `Rs. ${balance.toLocaleString()}`, true);

  // --- FOOTER ---
  doc.fontSize(8).fillColor(COLORS.textMuted).text("Thank you for choosing our services.", 0, 780, { align: "center", width: PAGE_WIDTH });

  doc.end();
};

/**
 * GENERATE DOCTOR-SPECIFIC WORK DONE REPORT PDF
 */
export const generateDoctorWorkDonePDF = (data: any, stream: any) => {
  const { doctor, clinic, records } = data;
  const doc = new PDFDocument({ margin: 0, size: "A4", bufferPages: true });

  doc.pipe(stream);

  const COLORS = {
    brand: "#0f172a", // Darker for professional look
    brandLight: "#334155",
    accent: "#3b82f6",
    textMain: "#1e293b",
    textMuted: "#64748b",
    bgLight: "#f8fafc",
    zebra: "#f1f5f9",
    success: "#10b981",
    danger: "#ef4444",
    border: "#e2e8f0",
    white: "#ffffff"
  };

  const PAGE_WIDTH = 595.28;
  const MARGIN = 30;
  const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

  // --- HEADER ---
  doc.rect(0, 0, PAGE_WIDTH, 120).fill(COLORS.brand);
  doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(18).text("DOCTOR PERFORMANCE REPORT", MARGIN, 35);
  doc.fontSize(10).opacity(0.7).font("Helvetica").text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, MARGIN, 60);

  // Doctor & Clinic Info (Top Right)
  doc.opacity(1).fontSize(14).font("Helvetica-Bold").text(`Dr. ${doctor?.name || "N/A"}`, PAGE_WIDTH - MARGIN - 250, 35, { align: "right", width: 250 });
  doc.fontSize(9).font("Helvetica").opacity(0.8).text(clinic?.company_name || "DENTAL CLINIC", PAGE_WIDTH - MARGIN - 250, 55, { align: "right", width: 250 });
  doc.text(clinic?.addressInfo?.[0]?.address || "", PAGE_WIDTH - MARGIN - 250, 70, { align: "right", width: 250 });

  // --- SUMMARY CARDS ---
  let y = 140;
  const totalBilled = records.reduce((sum: number, r: any) => sum + (r.amount - (r.discount || 0)), 0);
  const totalPaid = records.reduce((sum: number, r: any) => sum + (r.receivedAmount || 0), 0);
  const totalCount = records.length;

  const cardW = (CONTENT_WIDTH - 20) / 3;
  const drawStat = (x: number, label: string, value: string, color: string) => {
    doc.fillColor(COLORS.bgLight).roundedRect(x, y, cardW, 50, 8).fill();
    doc.lineWidth(0.5).strokeColor(COLORS.border).roundedRect(x, y, cardW, 50, 8).stroke();
    doc.fillColor(COLORS.textMuted).fontSize(7).font("Helvetica-Bold").text(label, x + 15, y + 12);
    doc.fillColor(color).fontSize(13).text(value, x + 15, y + 25);
  };

  drawStat(MARGIN, "TOTAL PROCEDURES", totalCount.toString(), COLORS.textMain);
  drawStat(MARGIN + cardW + 10, "TOTAL REVENUE", `Rs. ${totalBilled.toLocaleString()}`, COLORS.accent);
  drawStat(MARGIN + (cardW + 10) * 2, "TOTAL COLLECTED", `Rs. ${totalPaid.toLocaleString()}`, COLORS.success);

  // --- DATA TABLE ---
  y += 75;
  const tableHeaderH = 24;
  const rowH = 24;
  const colX = { date: MARGIN + 10, patient: MARGIN + 80, treatment: MARGIN + 230, amount: MARGIN + 400, status: MARGIN + 470 };

  doc.fillColor(COLORS.brandLight).roundedRect(MARGIN, y, CONTENT_WIDTH, tableHeaderH, 4).fill();
  doc.fillColor(COLORS.white).fontSize(8).font("Helvetica-Bold")
    .text("DATE", colX.date, y + 8)
    .text("PATIENT", colX.patient, y + 8)
    .text("TREATMENT", colX.treatment, y + 8)
    .text("BILL", colX.amount, y + 8, { width: 60, align: "right" })
    .text("STATUS", colX.status, y + 8, { width: 60, align: "center" });

  y += tableHeaderH + 5;
  let count = 0;

  records.forEach((record: any) => {
    if (count % 2 !== 0) doc.fillColor(COLORS.zebra).rect(MARGIN, y, CONTENT_WIDTH, rowH).fill();
    doc.lineWidth(0.1).strokeColor(COLORS.border).moveTo(MARGIN, y + rowH).lineTo(MARGIN + CONTENT_WIDTH, y + rowH).stroke();

    const date = new Date(record.createdAt).toLocaleDateString('en-IN');
    const patName = (record.patient as any)?.name || "Unknown";
    const treatment = (record.treatment as any)?.treatmentPlan || record.workDoneNote || "General";
    const bill = record.amount - (record.discount || 0);
    const paid = record.receivedAmount || 0;
    const isPaid = paid >= bill;

    doc.fillColor(COLORS.textMain).fontSize(8).font("Helvetica")
      .text(date, colX.date, y + 8)
      .text(patName.toUpperCase(), colX.patient, y + 8, { width: 140, ellipsis: true })
      .text(treatment, colX.treatment, y + 8, { width: 160, ellipsis: true })
      .font("Helvetica-Bold").text(bill.toLocaleString(), colX.amount, y + 8, { width: 60, align: "right" });

    // Mini Status
    doc.fillColor(isPaid ? COLORS.success : COLORS.danger).fontSize(7).text(isPaid ? "PAID" : "DUE", colX.status, y + 8, { width: 60, align: "center" });

    y += rowH;
    count++;

    if (y > 750) {
      doc.addPage({ margin: 0 });
      y = 40;
      doc.fillColor(COLORS.brandLight).rect(MARGIN, y, CONTENT_WIDTH, 1).fill();
      y += 10;
    }
  });

  // --- FOOTER ---
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(COLORS.textMuted).fontSize(7).font("Helvetica").text(`Page ${i + 1} of ${pages.count}  |  Confidential Doctor Report`, 0, 810, { align: "center", width: PAGE_WIDTH });
  }

  doc.end();
};

/**
 * GENERATE DOCTOR ACCOUNTABILITY / PAYOUT REPORT PDF
 */
export const generateAccountabilityPDF = (data: any, stream: any) => {
  const { records, clinic, doctor } = data;
  const doc = new PDFDocument({ margin: 0, size: "A4", bufferPages: true });

  doc.pipe(stream);

  const COLORS = {
    brand: "#4f46e5", // Indigo for finance look
    brandLight: "#818cf8",
    textMain: "#1e293b",
    textMuted: "#64748b",
    bgLight: "#f8fafc",
    zebra: "#f1f5f9",
    success: "#059669",
    orange: "#ea580c",
    border: "#e2e8f0",
    white: "#ffffff"
  };

  const PAGE_WIDTH = 595.28;
  const MARGIN = 30;
  const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

  // --- HEADER ---
  doc.rect(0, 0, PAGE_WIDTH, 120).fill(COLORS.brand);
  doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(18).text("COMMISSION LEDGER & PAYOUTS", MARGIN, 35);
  doc.fontSize(10).opacity(0.8).font("Helvetica").text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, MARGIN, 60);

  // Doctor & Clinic Info
  doc.opacity(1).fontSize(14).font("Helvetica-Bold").text(`Dr. ${doctor?.name || "N/A"}`, PAGE_WIDTH - MARGIN - 250, 35, { align: "right", width: 250 });
  doc.fontSize(9).font("Helvetica").opacity(0.8).text(clinic?.company_name || "DENTAL CLINIC", PAGE_WIDTH - MARGIN - 250, 55, { align: "right", width: 250 });

  // --- SUMMARY CARDS ---
  let y = 140;
  const totalShare = records.reduce((sum: number, r: any) => sum + (r.doctorShareAmount || 0), 0);
  const totalPaid = records.filter((r: any) => r.payoutStatus === "PAID").reduce((sum: number, r: any) => sum + (r.doctorShareAmount || 0), 0);
  const totalPending = totalShare - totalPaid;

  const cardW = (CONTENT_WIDTH - 20) / 3;
  const drawStat = (x: number, label: string, value: string, color: string) => {
    doc.fillColor(COLORS.bgLight).roundedRect(x, y, cardW, 50, 8).fill();
    doc.lineWidth(0.5).strokeColor(COLORS.border).roundedRect(x, y, cardW, 50, 8).stroke();
    doc.fillColor(COLORS.textMuted).fontSize(7).font("Helvetica-Bold").text(label, x + 15, y + 12);
    doc.fillColor(color).fontSize(13).text(value, x + 15, y + 25);
  };

  drawStat(MARGIN, "TOTAL EARNED", `Rs. ${totalShare.toLocaleString()}`, COLORS.textMain);
  drawStat(MARGIN + cardW + 10, "TOTAL PAID", `Rs. ${totalPaid.toLocaleString()}`, COLORS.success);
  drawStat(MARGIN + (cardW + 10) * 2, "TOTAL PENDING", `Rs. ${totalPending.toLocaleString()}`, COLORS.orange);

  // --- DATA TABLE ---
  y += 75;
  const tableHeaderH = 24;
  const rowH = 24;
  const colX = { date: MARGIN + 10, patient: MARGIN + 80, treatment: MARGIN + 210, bill: MARGIN + 360, share: MARGIN + 430, status: MARGIN + 500 };

  doc.fillColor(COLORS.brandLight).roundedRect(MARGIN, y, CONTENT_WIDTH, tableHeaderH, 4).fill();
  doc.fillColor(COLORS.white).fontSize(8).font("Helvetica-Bold")
    .text("DATE", colX.date, y + 8)
    .text("PATIENT", colX.patient, y + 8)
    .text("TREATMENT", colX.treatment, y + 8)
    .text("TOTAL", colX.bill, y + 8, { width: 60, align: "right" })
    .text("SHARE", colX.share, y + 8, { width: 60, align: "right" })
    .text("STATUS", colX.status, y + 8, { width: 55, align: "center" });

  y += tableHeaderH + 5;
  let count = 0;

  records.forEach((record: any) => {
    if (count % 2 !== 0) doc.fillColor(COLORS.zebra).rect(MARGIN, y, CONTENT_WIDTH, rowH).fill();
    doc.lineWidth(0.1).strokeColor(COLORS.border).moveTo(MARGIN, y + rowH).lineTo(MARGIN + CONTENT_WIDTH, y + rowH).stroke();

    const date = new Date(record.createdAt).toLocaleDateString('en-IN');
    const patName = (record.patient as any)?.name || "N/A";
    const treatment = record.treatmentName || "General";
    const bill = record.totalAmount || 0;
    const share = record.doctorShareAmount || 0;
    const status = record.payoutStatus || "PENDING";

    doc.fillColor(COLORS.textMain).fontSize(8).font("Helvetica")
      .text(date, colX.date, y + 8)
      .text(patName.toUpperCase(), colX.patient, y + 8, { width: 120, ellipsis: true })
      .text(treatment, colX.treatment, y + 8, { width: 140, ellipsis: true })
      .text(bill.toLocaleString(), colX.bill, y + 8, { width: 60, align: "right" })
      .font("Helvetica-Bold").text(share.toLocaleString(), colX.share, y + 8, { width: 60, align: "right" });

    // Status Mini Badge
    doc.fillColor(status === "PAID" ? COLORS.success : COLORS.orange).fontSize(7).text(status, colX.status, y + 8, { width: 55, align: "center" });

    y += rowH;
    count++;

    if (y > 750) {
      doc.addPage({ margin: 0 });
      y = 40;
    }
  });

  // --- FOOTER ---
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(COLORS.textMuted).fontSize(7).font("Helvetica").text(`Page ${i + 1} of ${pages.count}  |  Generated by ${clinic?.company_name || "Dental Clinic System"}`, 0, 810, { align: "center", width: PAGE_WIDTH });
  }

  doc.end();
};

/**
 * GENERATE INDIVIDUAL PAYMENT RECEIPT PDF (Vibrant Receipt Only)
 */
export const generatePaymentReceiptPDF = (data: any, stream: any) => {
  const { patient, clinic, record, payment } = data;
  const WIDTH = 340;
  const HEIGHT = 720;
  const doc = new PDFDocument({ margin: 0, size: [WIDTH, HEIGHT] });

  doc.pipe(stream);

  const COLORS = {
    brand: "#059669",
    textMain: "#1f2937",
    textMuted: "#6b7280",
    border: "#e5e7eb",
    white: "#ffffff"
  };

  // --- WHITE RECEIPT BODY ---
  doc.rect(0, 0, WIDTH, HEIGHT).fill(COLORS.white);

  // Vibrant Header
  doc.fillColor(COLORS.brand).rect(0, 0, WIDTH, 120).fill();

  // --- SCALLOPED DECORATION ---
  doc.fillColor(COLORS.white);
  for (let i = 0; i <= WIDTH; i += 15) {
    doc.circle(i, 0, 5).fill();
    doc.circle(i, HEIGHT, 5).fill();
  }

  // --- CARD HEADER ---
  doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(24).text("RECEIPT", 0, 40, { align: "center", width: WIDTH });
  doc.fontSize(8).font("Helvetica").opacity(0.8).text("OFFICIAL PAYMENT ACKNOWLEDGMENT", 0, 70, { align: "center", width: WIDTH });
  doc.fontSize(9).font("Helvetica-Bold").opacity(0.9).text(`No: ${record.receiptNumber || "N/A"}`, 0, 85, { align: "center", width: WIDTH });

  // Clinic Details
  let y = 145;
  doc.opacity(1).fillColor(COLORS.textMain).font("Helvetica-Bold").fontSize(16).text(clinic?.company_name?.toUpperCase() || "DENTAL CLINIC", 0, y, { align: "center", width: WIDTH });
  y += 20;
  doc.fontSize(9).font("Helvetica").fillColor(COLORS.textMuted).text(clinic?.addressInfo?.[0]?.address || "Clinic Address", 30, y, { align: "center", width: WIDTH - 60 });

  y += 40;
  doc.lineWidth(1).dash(2, { space: 2 }).strokeColor(COLORS.border).moveTo(30, y).lineTo(WIDTH - 30, y).stroke();
  doc.undash();

  // --- RECEIPT CONTENT ---
  y += 25;
  const drawRow = (label: string, value: string, currentY: number) => {
    doc.fillColor(COLORS.textMuted).fontSize(8).font("Helvetica-Bold").text(label.toUpperCase(), 40, currentY);
    doc.fillColor(COLORS.textMain).fontSize(10).font("Helvetica-Bold").text(value, WIDTH - 160, currentY, { width: 120, align: "right" });
    return currentY + 25;
  };

  y = drawRow("Patient", patient?.name || "N/A", y);
  y = drawRow("Patient ID", patient?.code || "N/A", y);
  y = drawRow("Date", new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), y);

  y += 20;
  doc.lineWidth(0.5).strokeColor(COLORS.border).moveTo(40, y).lineTo(WIDTH - 40, y).stroke();
  y += 25;

  // --- BILLING ITEM ---
  doc.fillColor(COLORS.textMuted).fontSize(8).font("Helvetica-Bold").text("ITEM DESCRIPTION", 40, y);
  doc.text("AMOUNT", WIDTH - 90, y, { width: 50, align: "right" });
  y += 20;

  doc.fillColor(COLORS.textMain).fontSize(11).font("Helvetica-Bold").text(record.treatmentName, 40, y, { width: 180 });
  doc.fillColor(COLORS.brand).fontSize(12).text(`₹ ${payment.amount.toLocaleString()}`, WIDTH - 120, y, { width: 80, align: "right" });

  y += 35;
  doc.fillColor(COLORS.textMuted).fontSize(9).font("Helvetica").text(`Dr. ${record.doctorName}  |  Tooth: ${record.tooth}`, 40, y);

  // --- TOTAL SECTION ---
  y += 60;
  doc.fillColor(COLORS.brand).rect(30, y, WIDTH - 60, 50).fill();
  doc.fillColor(COLORS.white).fontSize(10).font("Helvetica-Bold").text("TOTAL PAID", 50, y + 20);
  doc.fontSize(18).text(`₹ ${payment.amount.toLocaleString()}`, WIDTH - 150, y + 15, { width: 100, align: "right" });

  y += 75;
  doc.fillColor(COLORS.textMuted).fontSize(9).font("Helvetica-Bold").text(`METHOD: ${(payment.paymentMethod || "CASH").toUpperCase()}`, 40, y);
  doc.text(`ID: ${String(payment._id || "TXN").toUpperCase().substring(0, 10)}`, WIDTH - 140, y, { width: 100, align: "right" });

  // --- FOOTER ---
  y += 80;
  doc.fillColor(COLORS.brand).font("Helvetica-Bold").fontSize(14).text("Thank You!", 0, y, { align: "center", width: WIDTH });
  y += 20;
  doc.fontSize(8).font("Helvetica").fillColor(COLORS.textMuted).text("Professionally generated by Dental Clinic System", 0, y, { align: "center", width: WIDTH });

  doc.end();
};

/**
 * GENERATE SPECIALIZED WORK DONE CLINICAL REPORT WITH PRESCRIPTIONS
 */
export const generateWorkDoneReportPDF = (data: any, stream: any) => {
  const { patient, clinic, records, prescriptions: customPrescriptions, topPadding = 0, bottomPadding = 0, reportType = "both" } = data;
  const record = records[0] || {};
  const doc = new PDFDocument({
    margin: 0,
    size: "A4",
    bufferPages: true
  });

  doc.pipe(stream);

  const COLORS = {
    brand: "#1e3a8a",
    textMain: "#000000",
    textMuted: "#4b5563",
    border: "#000000",
    white: "#ffffff"
  };

  const PAGE_WIDTH = 595.28;
  const MARGIN = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

  let y = Number(topPadding) > 0 ? Number(topPadding) : 40;

  // --- REPORT TITLE BAR ---
  doc.lineWidth(1).strokeColor(COLORS.border).moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke();
  y += 15; // Extra padding from top border

  console.log('the patient are', patient)

  doc.fillColor(COLORS.textMain).font("Helvetica-Bold").fontSize(11);
  doc.text(`Work Done on  ${new Date(record.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}  For  ${patient?.profile_details?.personalInfo?.title ? (patient?.profile_details?.personalInfo?.title?.label || patient?.profile_details?.personalInfo?.title) : ""}  ${patient?.name?.toUpperCase() || "N/A"}`, MARGIN, y);

  y += 18; // Extra padding between the two lines

  const pInfo = patient?.profile_details?.personalInfo || {};
  let ageStr = "";
  if (pInfo.dob) {
    const ageDiffMs = Date.now() - new Date(pInfo.dob).getTime();
    if (ageDiffMs > 0) {
      const ageDate = new Date(ageDiffMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age > 0) ageStr = `${age}Y`;
    }
  }

  let sexStr = "";
  if (pInfo.gender === 1) sexStr = "Male";
  else if (pInfo.gender === 2) sexStr = "Female";
  else if (pInfo.gender === 3) sexStr = "Other";

  const addressObj = pInfo.addresses || {};
  const address = addressObj.residential || addressObj.office || addressObj.other || "";

  const metaArr = [];
  if (ageStr) metaArr.push(`Age: ${ageStr}`);
  if (sexStr) metaArr.push(`Sex: ${sexStr}`);
  if (address) metaArr.push(`Address: ${address}`);

  if (metaArr.length > 0) {
    const metaText = metaArr.join("   |   ");
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.textMuted);
    const textHeight = doc.heightOfString(metaText, { width: PAGE_WIDTH - 2 * MARGIN });
    doc.text(metaText, MARGIN, y, { width: PAGE_WIDTH - 2 * MARGIN });
    y += textHeight + 12; // Extra padding from bottom border
  } else {
    y += 10;
  }

  doc.lineWidth(1).strokeColor(COLORS.border).moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke();

  y += 25;

  if (reportType === "both" || reportType === "workdone_only") {
    // --- DOCTOR & PATIENT NOTES ---
    doc.fillColor(COLORS.textMain).font("Helvetica-Bold").fontSize(11).text(`Dr.${(record.doctor as any)?.name || "N/A"}`, MARGIN, y);
    y += 18;

    // --- NOTE & TOOTH DETAILS ON SAME LINE ---
    let noteText = record.workDoneNote || "";
    const toothDesc = record.tooth ? `${record.tooth} ${record.side || ""} ${record.position || ""}`.trim().toUpperCase() : "";

  if (noteText && toothDesc) {
    doc.font("Helvetica-Bold").fontSize(10).text(`${toothDesc}    `, MARGIN, y, { continued: true })
       .font("Helvetica-Oblique").text(noteText);
    y += doc.heightOfString(`${toothDesc}    ${noteText}`, { width: CONTENT_WIDTH }) + 10;
  } else if (noteText) {
    doc.font("Helvetica-Oblique").fontSize(10).text(noteText, MARGIN, y, { width: CONTENT_WIDTH });
    y += doc.heightOfString(noteText, { width: CONTENT_WIDTH }) + 10;
  } else if (toothDesc) {
    doc.font("Helvetica-Bold").fontSize(10).text(toothDesc, MARGIN, y, { width: CONTENT_WIDTH });
    y += doc.heightOfString(toothDesc, { width: CONTENT_WIDTH }) + 10;
    } else {
      y += 10;
    }
  }

  // --- PRESCRIPTION SECTION ---
  if ((reportType === "both" || reportType === "prescription_only") && customPrescriptions && customPrescriptions.length > 0) {
    doc.fillColor(COLORS.textMain).font("Helvetica-Bold").fontSize(11).text("Prescription:", MARGIN, y);
    y += 20;

  console.log('the prescription is', customPrescriptions)
  const prescriptionsToUse = customPrescriptions || [];
  prescriptionsToUse.forEach((p: any, index: number) => {
    // PRE-CALCULATE HEIGHT of the next item
    let itemHeight = 18 + 15 + 14 + 16 + 15; // Base height (Brand + Meta + Salt + Dose + Border/Gap)
    if (p.description) {
      itemHeight += 12 + doc.heightOfString(p.description, { width: CONTENT_WIDTH - 25 }) + 10;
    } else {
      itemHeight += 5;
    }

    const pageBottomLimit = 780 - Number(bottomPadding);

    // If this item will exceed the bottom limit, start a new page BEFORE printing it
    if (y + itemHeight > pageBottomLimit) {
      doc.addPage({ margin: 0 });
      y = 50;
      doc.fillColor(COLORS.textMain).font("Helvetica-Bold").fontSize(11).text("Prescription (cont.):", MARGIN, y);
      y += 25;
    }

    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.textMain).text(`${index + 1}.)`, MARGIN, y);

    // Brand Name and Type (Pushed right to avoid number overlap)
    doc.fillColor("#b91c1c").text(`${p.form || ""} - ${p.brandName || ""}`, MARGIN + 25, y, { continued: true });

    // Dosage Summary (printed immediately after the Brand Name)
    const qtyText = `   ( ${p.details || "*__*"} ) ( ${p.doseNo || 0} ${p.form || "Tablet"} Total )${p.noOfDays ? ` ( ${p.noOfDays} Days )` : ""}`;
    doc.fillColor(COLORS.textMain).text(qtyText);
    y += 18;

    doc.font("Helvetica-Oblique").fontSize(9).fillColor(COLORS.textMuted);
    doc.text(`( ${p.category || "General"} )  -  ( ${p.companyName || "N/A"} )`, MARGIN + 25, y);
    y += 15;

    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.textMain);
    doc.text(`BASIC SALT: `, MARGIN + 25, y, { continued: true }).font("Helvetica").text(p.basicSalt || "N/A");
    y += 14;

    doc.font("Helvetica-Bold").text(`DOSE: `, MARGIN + 25, y, { continued: true }).font("Helvetica").text(`${p.dosage || "N/A"}${p.noOfDays ? ` (for ${p.noOfDays} Days)` : ""}`);
    y += 16;

    if (p.description) {
      doc.font("Helvetica-Bold").fontSize(9).text(`Instructions:`, MARGIN + 25, y);
      y += 12;
      doc.font("Helvetica").fontSize(9).text(p.description, MARGIN + 25, y, { width: CONTENT_WIDTH - 25 });
      y += doc.heightOfString(p.description, { width: CONTENT_WIDTH - 25 }) + 10;
    } else {
      y += 5;
    }

    doc.lineWidth(0.2).strokeColor("#dddddd").moveTo(MARGIN + 25, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke();
    y += 15;
  });
  }

  // Remove manual empty space as requested
  y += 10;

  doc.end();
};

/**
 * GENERATE SPECIALIZED WORK DONE CLINICAL REPORT WITH PRESCRIPTIONS FOR MULTIPLE FILTERED RECORDS
 */
export const generateFilteredWorkDoneReportPDF = (data: any, stream: any) => {
  const { patient, clinic, records, prescriptions: customPrescriptions, topPadding = 0, bottomPadding = 0, reportType = "both" } = data;
  const safeRecords = Array.isArray(records) ? records : (records ? [records] : []);
  const doc = new PDFDocument({
    margin: 0,
    size: "A4",
    bufferPages: true
  });

  doc.pipe(stream);

  const COLORS = {
    brand: "#1e3a8a",
    textMain: "#000000",
    textMuted: "#4b5563",
    border: "#000000",
    white: "#ffffff"
  };

  const PAGE_WIDTH = 595.28;
  const MARGIN = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

  let y = Number(topPadding) > 0 ? Number(topPadding) : 40;

  // --- REPORT TITLE BAR ---
  doc.lineWidth(1).strokeColor(COLORS.border).moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke();
  y += 15; // Extra padding from top border

  doc.fillColor(COLORS.textMain).font("Helvetica-Bold").fontSize(11);
  const titleDate = safeRecords.length > 0 ? new Date(safeRecords[0].createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  doc.text(`Filtered Work Done on  ${titleDate}  For  ${patient?.profile_details?.personalInfo?.title ? (patient?.profile_details?.personalInfo?.title?.label || patient?.profile_details?.personalInfo?.title) : ""}  ${patient?.name?.toUpperCase() || "N/A"}`, MARGIN, y);

  y += 18; // Extra padding between the two lines

  const pInfo = patient?.profile_details?.personalInfo || {};
  let ageStr = "";
  if (pInfo.dob) {
    const ageDiffMs = Date.now() - new Date(pInfo.dob).getTime();
    if (ageDiffMs > 0) {
      const ageDate = new Date(ageDiffMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age > 0) ageStr = `${age}Y`;
    }
  }

  let sexStr = "";
  if (pInfo.gender === 1) sexStr = "Male";
  else if (pInfo.gender === 2) sexStr = "Female";
  else if (pInfo.gender === 3) sexStr = "Other";

  const addressObj = pInfo.addresses || {};
  const address = addressObj.residential || addressObj.office || addressObj.other || "";

  const metaArr = [];
  if (ageStr) metaArr.push(`Age: ${ageStr}`);
  if (sexStr) metaArr.push(`Sex: ${sexStr}`);
  if (address) metaArr.push(`Address: ${address}`);

  if (metaArr.length > 0) {
    const metaText = metaArr.join("   |   ");
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.textMuted);
    const textHeight = doc.heightOfString(metaText, { width: PAGE_WIDTH - 2 * MARGIN });
    doc.text(metaText, MARGIN, y, { width: PAGE_WIDTH - 2 * MARGIN });
    y += textHeight + 12; // Extra padding from bottom border
  } else {
    y += 10;
  }

  doc.lineWidth(1).strokeColor(COLORS.border).moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke();

  y += 25;

  if (reportType === "both" || reportType === "workdone_only") {
    // --- DOCTOR & PATIENT NOTES (Grouped by Doctor) ---
    const recordsByDoctor: { [key: string]: any[] } = {};
    safeRecords.forEach((record: any) => {
      const doctorName = (record.doctor as any)?.name || "N/A";
      if (!recordsByDoctor[doctorName]) {
        recordsByDoctor[doctorName] = [];
      }
      recordsByDoctor[doctorName].push(record);
    });

  const pageBottomLimit = 780 - Number(bottomPadding);

  Object.keys(recordsByDoctor).forEach((doctorName, docIndex) => {
    if (docIndex > 0) {
      doc.lineWidth(0.5).strokeColor(COLORS.border).moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke();
      y += 15;
    }

    if (y > pageBottomLimit - 40) {
      doc.addPage({ margin: 0 });
      y = 50;
    }

    doc.fillColor(COLORS.textMain).font("Helvetica-Bold").fontSize(11).text(`Dr. ${doctorName}`, MARGIN, y);
    y += 18;

    recordsByDoctor[doctorName].forEach((record: any, recIndex: number) => {
      // Add Date for this record
      const recordDate = new Date(record.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      
      let noteText = record.workDoneNote || "";
      const toothDesc = record.tooth ? `${record.tooth} ${record.side || ""} ${record.position || ""}`.trim().toUpperCase() : "";

      // Estimate height needed for this record
      let recordHeight = 14 + 10; // Date height + bottom padding
      if (noteText && toothDesc) recordHeight += doc.heightOfString(`${toothDesc}    ${noteText}`, { width: CONTENT_WIDTH });
      else if (noteText) recordHeight += doc.heightOfString(noteText, { width: CONTENT_WIDTH });
      else if (toothDesc) recordHeight += doc.heightOfString(toothDesc, { width: CONTENT_WIDTH });

      if (y + recordHeight > pageBottomLimit) {
        doc.addPage({ margin: 0 });
        y = 50;
        doc.fillColor(COLORS.textMain).font("Helvetica-Bold").fontSize(11).text(`Dr. ${doctorName} (cont.)`, MARGIN, y);
        y += 18;
      }

      if (recIndex > 0) {
        y += 5; // Spacing between records of the same doctor
      }

      doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.textMuted).text(recordDate, MARGIN, y);
      y += 14;

      doc.fillColor(COLORS.textMain); // Reset color to main text color for following fields

      // --- NOTE & TOOTH DETAILS ON SAME LINE ---
      if (noteText && toothDesc) {
        doc.font("Helvetica-Bold").fontSize(10).text(`${toothDesc}    `, MARGIN, y, { continued: true })
           .font("Helvetica-Oblique").text(noteText);
        y += doc.heightOfString(`${toothDesc}    ${noteText}`, { width: CONTENT_WIDTH }) + 10;
      } else if (noteText) {
        doc.font("Helvetica-Oblique").fontSize(10).text(noteText, MARGIN, y, { width: CONTENT_WIDTH });
        y += doc.heightOfString(noteText, { width: CONTENT_WIDTH }) + 10;
      } else if (toothDesc) {
        doc.font("Helvetica-Bold").fontSize(10).text(toothDesc, MARGIN, y, { width: CONTENT_WIDTH });
        y += doc.heightOfString(toothDesc, { width: CONTENT_WIDTH }) + 10;
      } else {
        y += 10;
      }
    });
  });
  }

  // --- PRESCRIPTION SECTION ---
  if ((reportType === "both" || reportType === "prescription_only") && customPrescriptions && customPrescriptions.length > 0) {
    doc.fillColor(COLORS.textMain).font("Helvetica-Bold").fontSize(11).text("Prescription:", MARGIN, y);
    y += 20;

    const prescriptionsToUse = customPrescriptions || [];
    prescriptionsToUse.forEach((p: any, index: number) => {

      console.log('the p are', p)
      // PRE-CALCULATE HEIGHT of the next item
      let itemHeight = 18 + 15 + 14 + 16 + 15; // Base height (Brand + Meta + Salt + Dose + Border/Gap)
      if (p.description) {
        itemHeight += 12 + doc.heightOfString(p.description, { width: CONTENT_WIDTH - 25 }) + 10;
      } else {
        itemHeight += 5;
      }

      const pageBottomLimit = 780 - Number(bottomPadding);

      // If this item will exceed the bottom limit, start a new page BEFORE printing it
      if (y + itemHeight > pageBottomLimit) {
        doc.addPage({ margin: 0 });
        y = 50;
        doc.fillColor(COLORS.textMain).font("Helvetica-Bold").fontSize(11).text("Prescription (cont.):", MARGIN, y);
        y += 25;
      }

      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.textMain).text(`${index + 1}.)`, MARGIN, y);

      // Brand Name and Type (Pushed right to avoid number overlap)
      doc.fillColor("#b91c1c").text(`${p.form || ""}-${p.brandName || ""}`, MARGIN + 25, y, { continued: true });

      // Dosage Summary (printed immediately after the Brand Name)
      const qtyText = `   ( ${p.details || "*__*"} ) ( ${p.doseNo || 0} ${p.form || "Tablet"} Total )${p.noOfDays ? ` ( ${p.noOfDays} Days )` : ""}`;
      doc.fillColor(COLORS.textMain).text(qtyText);
      y += 18;

      doc.font("Helvetica-Oblique").fontSize(9).fillColor(COLORS.textMuted);
      doc.text(`( ${p.category || "General"} )  -  ( ${p.companyName || "N/A"} )`, MARGIN + 25, y);
      y += 15;

      doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.textMain);
      doc.text(`BASIC SALT: `, MARGIN + 25, y, { continued: true }).font("Helvetica").text(p.basicSalt || "N/A");
      y += 14;

      doc.font("Helvetica-Bold").text(`DOSE: `, MARGIN + 25, y, { continued: true }).font("Helvetica").text(`${p.dosage || "N/A"}${p.noOfDays ? ` (for ${p.noOfDays} Days)` : ""}`);
      y += 16;

      if (p.description) {
        doc.font("Helvetica-Bold").fontSize(9).text(`Instructions:`, MARGIN + 25, y);
        y += 12;
        doc.font("Helvetica").fontSize(9).text(p.description, MARGIN + 25, y, { width: CONTENT_WIDTH - 25 });
        y += doc.heightOfString(p.description, { width: CONTENT_WIDTH - 25 }) + 10;
      } else {
        y += 5;
      }

      doc.lineWidth(0.2).strokeColor("#dddddd").moveTo(MARGIN + 25, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke();
      y += 15;
    });

    // Remove manual empty space as requested
    y += 10;
  }

  doc.end();
};

/**
 * GENERATE DAILY WORK DONE REPORT (BULK)
 * Lists all procedures for a specific day and adds a single prescription list.
 */
export const generateDailyWorkDoneReportPDF = (data: any, stream: any) => {
  const { records = [], patient, date: reportDateParam, prescriptions: customPrescriptions, topPadding = 150, bottomPadding = 50, reportType = "both" } = data;

  console.log(records)
  const doc = new PDFDocument({ margin: 0, size: "A4", bufferPages: true });
  doc.pipe(stream);

  const COLORS = {
    brand: "#1e3a8a",
    textMain: "#111827",
    textMuted: "#6b7280",
    border: "#e5e7eb",
  };

  const PAGE_WIDTH = 595.28;
  const MARGIN = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

  let y = Number(topPadding);

  // --- Header & Patient Details ---
  const title = reportType === "prescription"
    ? "Daily Prescription Report"
    : "Daily Treatment Summary";

  doc.fillColor(COLORS.textMain).font("Helvetica-Bold").fontSize(14).text(title, MARGIN, y);
  y += 22;

  const patientToUse = patient || (records.length > 0 ? records[0].patient : null);

  if (patientToUse) {
    const reportDate = reportDateParam ? new Date(reportDateParam).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    }) : (records.length > 0 ? new Date(records[0].createdAt).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    }) : new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    }));

    // Patient Info Row
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.textMain).text("Patient:", MARGIN, y, { continued: true });
    doc.font("Helvetica").text(` ${patientToUse?.title ? (patientToUse?.title?.label || patientToUse?.title) : ""} ${patientToUse?.name || "N/A"}`, { continued: true });
    doc.font("Helvetica-Bold").text("    Age/Sex:", { continued: true });
    doc.font("Helvetica").text(` ${calculateAge(patientToUse?.profile_details?.personalInfo?.dob) || "N/A"} / ${patientToUse?.profile_details?.personalInfo?.gender ? patientToUse?.profile_details?.personalInfo?.gender === 1 ? "Male" : "Female" : "N/A"}`, { continued: true });
    doc.font("Helvetica-Bold").text("    Date:", { continued: true });
    doc.font("Helvetica").text(` ${reportDate}`);
    y += 15;

    // Address Row
    if (patientToUse?.profile_details?.personalInfo?.address) {
      doc.font("Helvetica-Bold").fontSize(10).text("Address: ", MARGIN, y, { continued: true });
      doc.font("Helvetica").text(patientToUse.profile_details?.personalInfo?.address, { width: CONTENT_WIDTH - 50 });
      y += doc.heightOfString(patientToUse.profile_details.personalInfo?.address, { width: CONTENT_WIDTH - 50 }) + 10;
    } else {
      y += 10;
    }

    doc.lineWidth(1).strokeColor(COLORS.border).moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke();
    y += 15;
  }

  // --- Procedures List ---
  if (reportType !== "prescription" && records.length > 0) {
    doc.fillColor(COLORS.textMain).font("Helvetica-Bold").fontSize(11).text("Procedures Performed:", MARGIN, y);
    y += 20;

  records.forEach((record: any, index: number) => {
    // Check height for procedure entry
    let procHeight = 50;
    if (record.workDoneNote) procHeight += 20;

    if (y + procHeight > (780 - Number(bottomPadding))) {
      doc.addPage({ margin: 0 });
      y = 50;
      doc.fillColor(COLORS.textMain).font("Helvetica-Bold").fontSize(11).text("Procedures Performed (cont.):", MARGIN, y);
      y += 25;
    }

    // Procedure Title
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.textMain).text(`${index + 1}. ${record.treatment?.treatmentPlan || record.workDoneNote || "General Procedure"}`, MARGIN + 10, y);
    y += 15;

    // Doctor & Tooth Info
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.textMuted);
    doc.text(`Doctor: `, MARGIN + 25, y, { continued: true }).font("Helvetica").text(record.doctor?.name || "N/A", { continued: true });
    doc.font("Helvetica-Bold").text(`    Tooth: `, { continued: true }).font("Helvetica").text(record.tooth || "N/A");
    y += 15;

    if (record.workDoneNote) {
      doc.font("Helvetica-Oblique").fontSize(9).fillColor(COLORS.textMuted).text(`Note: ${record.workDoneNote}`, MARGIN + 25, y, { width: CONTENT_WIDTH - 25 });
      y += doc.heightOfString(record.workDoneNote, { width: CONTENT_WIDTH - 25 }) + 10;
    } else {
      y += 5;
    }

    doc.lineWidth(0.2).strokeColor("#dddddd").moveTo(MARGIN + 10, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke();
    y += 15;
  });

  y += 15;
  }

  // --- Prescription Section ---
  if (reportType !== "procedures" && customPrescriptions && customPrescriptions.length > 0) {
    doc.fillColor(COLORS.textMain).font("Helvetica-Bold").fontSize(11).text("Combined Prescription:", MARGIN, y);
    y += 20;

    customPrescriptions.forEach((p: any, index: number) => {
      let itemHeight = 18 + 15 + 14 + 16 + 15;
      if (p.description) itemHeight += 12 + doc.heightOfString(p.description, { width: CONTENT_WIDTH - 25 }) + 10;
      else itemHeight += 5;

      if (y + itemHeight > (780 - Number(bottomPadding))) {
        doc.addPage({ margin: 0 });
        y = 50;
        doc.fillColor(COLORS.textMain).font("Helvetica-Bold").fontSize(11).text("Combined Prescription (cont.):", MARGIN, y);
        y += 25;
      }

      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.textMain).text(`${index + 1}.)`, MARGIN, y);
      doc.fillColor("#b91c1c").text(`${p.type || ""} ${p.brandName || ""}`, MARGIN + 25, y, { continued: true });

      const qtyText = `   ( ${p.details || "*__*"} ) ( ${p.doseNo || 0} ${p.form || "Tablet"} Total )${p.noOfDays ? ` ( ${p.noOfDays} Days )` : ""}`;
      doc.fillColor(COLORS.textMain).text(qtyText);
      y += 18;

      doc.font("Helvetica-Oblique").fontSize(9).fillColor(COLORS.textMuted);
      doc.text(`( ${p.category || "General"} )  -  ( ${p.companyName || "N/A"} )`, MARGIN + 25, y);
      y += 15;

      doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.textMain);
      doc.text(`BASIC SALT: `, MARGIN + 25, y, { continued: true }).font("Helvetica").text(p.basicSalt || "N/A");
      y += 14;

      doc.font("Helvetica-Bold").text(`DOSE: `, MARGIN + 25, y, { continued: true }).font("Helvetica").text(`${p.dosage || "N/A"}${p.noOfDays ? ` (for ${p.noOfDays} Days)` : ""}`);
      y += 16;

      if (p.description) {
        doc.font("Helvetica-Bold").fontSize(9).text(`Instructions:`, MARGIN + 25, y);
        y += 12;
        doc.font("Helvetica").fontSize(9).text(p.description, MARGIN + 25, y, { width: CONTENT_WIDTH - 25 });
        y += doc.heightOfString(p.description, { width: CONTENT_WIDTH - 25 }) + 10;
      } else {
        y += 5;
      }

      doc.lineWidth(0.2).strokeColor("#dddddd").moveTo(MARGIN + 25, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke();
      y += 15;
    });
  }

  doc.end();
};


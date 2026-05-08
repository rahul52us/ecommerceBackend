import PDFDocument from "pdfkit";

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
    treatment: MARGIN + 70,
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
      .text(treatment, colX.treatment, y + 9, { width: 200, height: 12, ellipsis: true })
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
  doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(24).text("TREATMENT RECEIPT", MARGIN, 40);
  doc.fontSize(10).opacity(0.8).text(`Date: ${new Date().toLocaleDateString()}`, MARGIN, 70);

  // Clinic Info (Top Right)
  doc.opacity(1).fontSize(14).text(clinic?.company_name?.toUpperCase() || "DENTAL CLINIC", PAGE_WIDTH - MARGIN - 200, 40, { align: "right", width: 200 });
  doc.fontSize(9).font("Helvetica").opacity(0.8).text(clinic?.addressInfo?.[0]?.address || "", PAGE_WIDTH - MARGIN - 200, 60, { align: "right", width: 200 });

  // --- PATIENT CARD ---
  let y = 160;
  doc.fillColor(COLORS.bgLight).roundedRect(MARGIN, y, CONTENT_WIDTH, 80, 10).fill();
  doc.lineWidth(0.5).strokeColor(COLORS.border).roundedRect(MARGIN, y, CONTENT_WIDTH, 80, 10).stroke();

  doc.fillColor(COLORS.textMuted).fontSize(8).font("Helvetica-Bold").text("PATIENT DETAILS", MARGIN + 20, y + 15);
  doc.fillColor(COLORS.textMain).fontSize(16).text(patient?.name || "N/A", MARGIN + 20, y + 30);
  doc.fillColor(COLORS.textMuted).fontSize(9).font("Helvetica").text(`ID: ${patient?.code || "N/A"}  |  Mob: ${patient?.mobileNumber || "N/A"}`, MARGIN + 20, y + 52);

  // --- TREATMENT DETAILS ---
  y += 110;
  doc.fillColor(COLORS.textMuted).fontSize(8).font("Helvetica-Bold").text("TREATMENT INFORMATION", MARGIN, y);
  y += 15;
  doc.lineWidth(1).strokeColor(COLORS.brand).moveTo(MARGIN, y).lineTo(MARGIN + 30, y).stroke();
  y += 15;

  doc.fillColor(COLORS.textMain).fontSize(12).font("Helvetica-Bold").text("Procedure:", MARGIN, y);
  doc.font("Helvetica").text((record.treatment as any)?.treatmentPlan || record.workDoneNote || "General Procedure", MARGIN + 80, y);
  y += 20;

  doc.font("Helvetica-Bold").text("Doctor:", MARGIN, y);
  doc.font("Helvetica").text(`Dr. ${(record.doctor as any)?.name || "N/A"}`, MARGIN + 80, y);
  y += 20;

  doc.font("Helvetica-Bold").text("Tooth:", MARGIN, y);
  doc.font("Helvetica").text(record.tooth || "N/A", MARGIN + 80, y);
  y += 30;

  // Clinical Notes
  if (record.workDoneNote) {
    doc.fillColor(COLORS.bgLight).roundedRect(MARGIN, y, CONTENT_WIDTH, 60, 8).fill();
    doc.fillColor(COLORS.textMuted).fontSize(8).font("Helvetica-Bold").text("CLINICAL NOTES", MARGIN + 15, y + 12);
    doc.fillColor(COLORS.textMain).fontSize(9).font("Helvetica").text(record.workDoneNote, MARGIN + 15, y + 25, { width: CONTENT_WIDTH - 30 });
    y += 80;
  }

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
  doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(24).text("RECEIPT", 0, 45, { align: "center", width: WIDTH });
  doc.fontSize(8).font("Helvetica").opacity(0.8).text("OFFICIAL PAYMENT ACKNOWLEDGMENT", 0, 75, { align: "center", width: WIDTH });

  // Clinic Details
  let y = 145;
  doc.opacity(1).fillColor(COLORS.textMain).font("Helvetica-Bold").fontSize(16).text(clinic?.company_name?.toUpperCase() || "DENTAL CLINIC", 0, y, { align: "center", width: WIDTH });
  y += 20;
  doc.fontSize(9).font("Helvetica").fillColor(COLORS.textMuted).text(clinic?.addressInfo?.[0]?.address || "Clinic Address", 30, y, { align: "center", width: WIDTH - 60 });

  y += 40;
  doc.lineWidth(1).dash(2, {space: 2}).strokeColor(COLORS.border).moveTo(30, y).lineTo(WIDTH - 30, y).stroke();
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

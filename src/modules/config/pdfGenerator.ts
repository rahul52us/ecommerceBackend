import PDFDocument from "pdfkit";

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
  const MARGIN = 20; // Decreased margin
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
  const headerHeight = 110; // Slightly shorter header
  doc.rect(0, 0, PAGE_WIDTH, headerHeight).fill(COLORS.brand);
  
  // Clinic Info (Left Side)
  doc
    .fillColor(COLORS.white)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(clinic?.name?.toUpperCase() || "DENTAL CLINIC", MARGIN, 25)
    .fontSize(8.5)
    .font("Helvetica")
    .opacity(0.8)
    .text(`${clinic?.address || ""} | ${clinic?.city || ""}`, MARGIN, 52)
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
  const rowH = 28; // Tighter rows
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
    const treatment = record.treatmentPlan || record.workDoneNote || record.treatmentCode || "General Procedure";
    const doctor = record.doctor?.name || "N/A";
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

    // Status Badge (Properly Centered)
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
    .text(`Statement generated by ${clinic?.name || "Clinic System"}`, MARGIN, footerY + 10, { align: "left" })
    .text(`Page Count: ${doc.bufferedPageRange().count}`, PAGE_WIDTH - MARGIN - 100, footerY + 10, { align: "right", width: 100 });

  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(COLORS.textMuted).fontSize(7).text(`Page ${i + 1} of ${pages.count}`, 0, 815, { align: "center", width: PAGE_WIDTH });
  }

  doc.end();
};

import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
// @ts-ignore
const MDBReader = require("mdb-reader").default || require("mdb-reader");

const MDB_FILE = process.argv[2] || "F:\\downloads\\dentalcare.mdb";

async function exportToExcel() {
  console.log(`Reading MDB file at: ${MDB_FILE}`);
  if (!fs.existsSync(MDB_FILE)) {
    console.error(`ERROR: MDB file not found at ${MDB_FILE}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(path.resolve(MDB_FILE));
  const reader = new MDBReader(buffer);
  
  console.log("Extracting tables...");
  
  const patients = reader.getTable("pat_code").getData();
  const wrkComp = reader.getTable("wrk_comp").getData();
  const wrkCompDetail = reader.getTable("wrk_comp_Detail").getData();
  const prescriptions = reader.getTable("Wrk_Prescription").getData();
  const fees = reader.getTable("Wrk_fee").getData();
  const transactions = reader.getTable("act_tran").getData();
  const appointments = reader.getTable("pat_sch").getData();
  const dentHis = reader.getTable("dent_his").getData();

  console.log("Tables extracted. Preparing Excel workbook...");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dental System Export";
  workbook.created = new Date();

  const formatDate = (dateString: any) => {
    if (!dateString) return "";
    try { return new Date(dateString).toLocaleDateString('en-IN'); }
    catch (e) { return String(dateString); }
  };

  // 1. Patients & Medical History Sheet
  console.log("Building Patients sheet...");
  const sheet1 = workbook.addWorksheet("Patients & History");
  sheet1.columns = [
    { header: "Patient Code", key: "pat_code", width: 15 },
    { header: "Name", key: "name", width: 25 },
    { header: "Phone", key: "phone", width: 15 },
    { header: "Chief Complaint", key: "chief_com", width: 30 },
    { header: "Dental History", key: "dent_his", width: 30 },
    { header: "Medical History", key: "med_his", width: 30 },
    { header: "Allergies", key: "allergy", width: 20 },
    { header: "Surgeries", key: "surgery", width: 20 }
  ];

  patients.forEach((p: any) => {
    const history = dentHis.find((h: any) => String(h.pat_code) === String(p.pcode)) || {};
    sheet1.addRow({
      pat_code: p.pcode,
      name: `${p.f_name || ''} ${p.l_name || ''}`.trim(),
      phone: p.ph_1 || p.ph_2,
      chief_com: history.chief_com || "",
      dent_his: history.dent_his || "",
      med_his: history.med_his || "",
      allergy: history.allergy || "",
      surgery: history.surgery || ""
    });
  });

  // 2. Clinical Work & Prescriptions Sheet
  console.log("Building Clinical Work & Prescriptions sheet...");
  const sheet2 = workbook.addWorksheet("Clinical Work & Prescriptions");
  sheet2.columns = [
    { header: "Work ID", key: "wrk_id", width: 15 },
    { header: "Patient Code", key: "pat_code", width: 15 },
    { header: "Date", key: "date", width: 12 },
    { header: "Fee Due", key: "fee_due", width: 10 },
    { header: "Fee Discount", key: "fee_dis", width: 12 },
    { header: "Work Done", key: "work_done", width: 40 },
    { header: "Medicines Prescribed", key: "medicines", width: 50 },
  ];

  wrkComp.forEach((wc: any) => {
    const details = wrkCompDetail.filter((d: any) => String(d.Wrk_done_id) === String(wc.Wrk_done_id));
    const meds = prescriptions.filter((m: any) => String(m.Wrk_done_id) === String(wc.Wrk_done_id));
    
    const workDoneText = details.map((d: any) => {
      let t = "";
      if (d.ToothNo) t += `Tooth: ${d.ToothNo} `;
      if (d.Wrk_Done) t += `Work: ${d.Wrk_Done} `;
      if (d.Sp_Notes) t += `Notes: ${d.Sp_Notes}`;
      return t;
    }).join(" | ");

    const medText = meds.map((m: any) => {
      return `${m.BrandName || ''} (${m.Dosage || ''} for ${m.Days || ''} days)`;
    }).join(", ");

    sheet2.addRow({
      wrk_id: wc.Wrk_done_id,
      pat_code: wc.pat_code,
      date: formatDate(wc.wrk_date),
      fee_due: wc.fee_due || 0,
      fee_dis: wc.fee_dis || 0,
      work_done: workDoneText,
      medicines: medText
    });
  });

  // 3. Transactions Sheet
  console.log("Building Transactions sheet...");
  const sheet3 = workbook.addWorksheet("Transactions");
  sheet3.columns = [
    { header: "Patient Code", key: "pat_code", width: 15 },
    { header: "Date", key: "date", width: 12 },
    { header: "Amount Paid", key: "fee_rec", width: 15 }
  ];

  transactions.forEach((t: any) => {
    sheet3.addRow({
      pat_code: t.pat_code,
      date: formatDate(t.date || t.wrk_date),
      fee_rec: t.fee_rec
    });
  });

  // 4. Appointments Sheet
  console.log("Building Appointments sheet...");
  const sheet4 = workbook.addWorksheet("Appointments");
  sheet4.columns = [
    { header: "Patient Code", key: "pat_code", width: 15 },
    { header: "Date", key: "date", width: 15 },
    { header: "Cause", key: "cause", width: 30 }
  ];

  appointments.forEach((a: any) => {
    sheet4.addRow({
      pat_code: a.pat_code,
      date: formatDate(a.book_date),
      cause: a.cause
    });
  });

  workbook.eachSheet((sheet) => {
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  });

  const outputPath = path.join(process.cwd(), "LegacyDataExport.xlsx");
  console.log(`Writing to file: ${outputPath}`);
  await workbook.xlsx.writeFile(outputPath);
  
  console.log("✅ Export Complete!");
}

exportToExcel().catch(console.error);

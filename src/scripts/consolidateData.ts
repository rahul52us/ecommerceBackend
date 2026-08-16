import fs from "fs";
import path from "path";
import MDBReader from "mdb-reader";
import ExcelJS from "exceljs";

async function consolidateData() {
  try {
    const filePath = "f:\\downloads\\dentalcare.mdb";

    if (!fs.existsSync(filePath)) {
      throw new Error("MDB file not found at " + filePath);
    }

    console.log("Reading MDB file...");
    const buffer = fs.readFileSync(path.resolve(filePath));
    const reader = new MDBReader(buffer);

    const getTableData = (name: string) => {
      try { return reader.getTable(name).getData(); } catch { return []; }
    };

    console.log("Extracting tables...");
    const patCode = getTableData("pat_code");
    const wrkComp = getTableData("wrk_comp");
    const wrkCompDetail = getTableData("wrk_comp_Detail");
    const wrkPrescription = getTableData("Wrk_Prescription");
    const patGroup = getTableData("Pat_Group");
    const docMst = getTableData("doc_mst");
    const actTranLink = getTableData("act_tran_link");

    console.log(`Processing ${patCode.length} patients and ${wrkComp.length} events...`);

    // Mapping Doc names
    const docMap = new Map();
    docMst.forEach((d: any) => docMap.set(d.code, d.name));

    // Mapping Family Groups
    const groupMap = new Map();
    patGroup.forEach((g: any) => groupMap.set(g.code, g.descript));

    // 1. Process Patients (Normalize keys, collect demographics)
    const patientMap = new Map();
    patCode.forEach((p: any) => {
      if (p.pcode) {
        const pcodeClean = String(p.pcode).trim().toUpperCase();
        
        let ph = [p.ph_1, p.ph_2, p.ph_3, p.ph_4].filter(Boolean).join(", ");
        let addr = [p.r_add_1, p.r_add_2, p.r_city, p.r_pin].filter(Boolean).join(", ");
        
        patientMap.set(pcodeClean, {
          pcodeClean,
          fullName: `${p.f_name || ''} ${p.l_name || ''}`.trim(),
          sex: p.sex || "",
          age: p.age || "",
          phone: ph,
          address: addr,
          email: p.e_mail || "",
          regDate: p.reg_date ? p.reg_date : "",
          referral: p.ref_by || "",
          familyGroup: groupMap.get(p.GroupID) || "",
          visits: [],
          payments: new Map() // By Date
        });
      }
    });

    // 2. Process Payments (Summed per patient per date)
    actTranLink.forEach((r: any) => {
      if (r.pat_code && r.wrk_date) {
        const pcodeClean = String(r.pat_code).trim().toUpperCase();
        const rawDate = r.wrk_date instanceof Date ? r.wrk_date.toISOString().split('T')[0] : String(r.wrk_date).split(' ')[0];
        
        if (patientMap.has(pcodeClean)) {
          const patient = patientMap.get(pcodeClean);
          if (!patient.payments.has(rawDate)) {
            patient.payments.set(rawDate, { amount: 0, modes: [] });
          }
          const pDay = patient.payments.get(rawDate);
          pDay.amount += Number(r.amt) || 0;
          if (r.paidAs) pDay.modes.push(r.paidAs);
        }
      }
    });

    // 3. Process Work Events
    const eventMap = new Map();
    let collisionCount = 0;
    
    wrkComp.forEach((w: any) => {
      if (w.Wrk_done_id && w.pat_code) {
        const pcodeClean = String(w.pat_code).trim().toUpperCase();
        let eventId = String(w.Wrk_done_id);
        
        // Handle ID collision
        if (eventMap.has(eventId)) {
           collisionCount++;
           eventId = `${eventId}_dup${collisionCount}`;
        }
        
        const rawDate = w.wrk_date ? (w.wrk_date instanceof Date ? w.wrk_date.toISOString().split('T')[0] : String(w.wrk_date).split(' ')[0]) : "";

        const visit = {
          eventId,
          date: rawDate,
          fee: w.fee_due || 0,
          discount: w.fee_dis || 0,
          stage: w.treat_stage || "",
          doctorName: docMap.get(w.Doc_Code) || String(w.Doc_Code || ''),
          treatments: [],
          prescriptions: [],
        };
        
        eventMap.set(eventId, visit);
        
        if (patientMap.has(pcodeClean)) {
          patientMap.get(pcodeClean).visits.push(visit);
        }
      }
    });

    // 4. Attach details (teeth) to events
    wrkCompDetail.forEach((d: any) => {
      if (d.Wrk_done_id) {
        const eventId = String(d.Wrk_done_id);
        // Note: If the detail belonged to the duplicated event, we might miss it unless we know WHICH patient it was for.
        // For simplicity, we just attach to the first one that had this ID.
        if (eventMap.has(eventId)) {
          eventMap.get(eventId).treatments.push(d);
        }
      }
    });

    // 5. Attach prescriptions to events
    wrkPrescription.forEach((pr: any) => {
      if (pr.Wrk_done_id) {
        const eventId = String(pr.Wrk_done_id);
        if (eventMap.has(eventId)) {
          eventMap.get(eventId).prescriptions.push(pr);
        }
      }
    });

    // 6. Generate Rows for Excel
    let finalRows: any[] = [];
    patientMap.forEach((patient) => {
      if (patient.visits.length === 0) {
        // Patient with no visits
        finalRows.push({
          pcode: patient.pcodeClean,
          name: patient.fullName,
          sex: patient.sex,
          age: patient.age,
          phone: patient.phone,
          address: patient.address,
          email: patient.email,
          regDate: patient.regDate,
          referral: patient.referral,
          familyGroup: patient.familyGroup,
          visitDate: "",
          doctor: "",
          treatments: "",
          prescriptions: "",
          stage: "",
          fee: "",
          discount: "",
          amountPaid: "",
          paymentModes: "",
          workId: ""
        });
      } else {
        // Sort visits by date and then eventId to ensure consistent first-of-day logic
        patient.visits.sort((a: any, b: any) => {
           const d = String(a.date).localeCompare(String(b.date));
           if (d !== 0) return d;
           return String(a.eventId).localeCompare(String(b.eventId));
        });
        
        let lastSeenDate = "";

        patient.visits.forEach((v: any) => {
          const payments = patient.payments.get(v.date) || { amount: 0, modes: [] };
          
          let amountPaid: number | string = "";
          let paymentModes = "";

          if (v.date !== lastSeenDate && v.date !== "") {
            amountPaid = payments.amount || 0;
            paymentModes = [...new Set(payments.modes)].filter(Boolean).join(", ");
            lastSeenDate = v.date;
          } else if (v.date === "") {
             amountPaid = payments.amount || 0;
             paymentModes = [...new Set(payments.modes)].filter(Boolean).join(", ");
          } else {
            amountPaid = 0;
          }

          finalRows.push({
            pcode: patient.pcodeClean,
            name: patient.fullName,
            sex: patient.sex,
            age: patient.age,
            phone: patient.phone,
            address: patient.address,
            email: patient.email,
            regDate: patient.regDate,
            referral: patient.referral,
            familyGroup: patient.familyGroup,
            visitDate: v.date,
            doctor: v.doctorName,
            treatments: v.treatments.map((t: any) => `[${t.ToothNo || ''}] ${t.ToothName || ''}: ${t.Wrk_Done || ''}`).join(" | "),
            prescriptions: v.prescriptions.map((pr: any) => `${pr.BrandName || ''} (${pr.Dosage || ''}, ${pr.Days || ''} days)`).join(" | "),
            stage: v.stage === 'F' ? 'Finished' : (v.stage === 'P' ? 'In Progress' : v.stage),
            fee: v.fee,
            discount: v.discount,
            amountPaid: amountPaid,
            paymentModes: paymentModes,
            workId: v.eventId
          });
        });
      }
    });

    // 7. Sort by Name then Date
    finalRows.sort((a, b) => {
      const nameCmp = String(a.name).localeCompare(String(b.name));
      if (nameCmp !== 0) return nameCmp;
      return String(a.visitDate).localeCompare(String(b.visitDate));
    });

    // 8. Generate Excel
    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const outputPath = path.join(exportDir, "Consolidated_Patient_Data.xlsx");
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename: outputPath });
    const worksheet = workbook.addWorksheet("Data", { views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }] });

    worksheet.columns = [
      { header: "Patient Code", key: "pcode", width: 15 },
      { header: "Name", key: "name", width: 25 },
      { header: "Sex", key: "sex", width: 8 },
      { header: "Age", key: "age", width: 8 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Address", key: "address", width: 30 },
      { header: "Email", key: "email", width: 20 },
      { header: "Reg Date", key: "regDate", width: 15 },
      { header: "Family Group", key: "familyGroup", width: 20 },
      { header: "Referral", key: "referral", width: 15 },
      { header: "Visit Date", key: "visitDate", width: 15 },
      { header: "Doctor", key: "doctor", width: 20 },
      { header: "Treatments", key: "treatments", width: 50 },
      { header: "Prescriptions", key: "prescriptions", width: 50 },
      { header: "Stage", key: "stage", width: 10 },
      { header: "Fee Due", key: "fee", width: 10 },
      { header: "Discount", key: "discount", width: 10 },
      { header: "Amount Paid", key: "amountPaid", width: 15 },
      { header: "Payment Modes", key: "paymentModes", width: 20 },
      { header: "Work ID", key: "workId", width: 10 }
    ];

    // Filter dropdowns
    worksheet.autoFilter = 'A1:T1';

    for (const row of finalRows) {
      worksheet.addRow(row).commit();
    }

    worksheet.commit();
    await workbook.commit();
    
    let noHistoryCount = finalRows.filter(r => !r.visitDate).length;
    
    console.log(`\nConsolidation complete!`);
    console.log(`Total Output Rows: ${finalRows.length}`);
    console.log(`Patients with no recorded history: ${noHistoryCount}`);
    console.log(`File saved at: ${outputPath}`);

  } catch (error) {
    console.error("Error during consolidation:", error);
  }
}

consolidateData();

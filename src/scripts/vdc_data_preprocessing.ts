import fs from 'fs';
import MDBReader from 'mdb-reader';
import ExcelJS from 'exceljs';
import moment from 'moment';

const mdbPath = process.argv[2] || 'dentalcare.mdb';
const outPath = process.argv[3] || 'DentalCare_Patient_History.xlsx';

if (!fs.existsSync(mdbPath)) {
  console.error(`ERROR: MDB file not found at ${mdbPath}`);
  process.exit(1);
}

const buffer = fs.readFileSync(mdbPath);
const reader = new MDBReader(buffer);

function loadTable(tableName: string) {
  try {
    const table = reader.getTable(tableName);
    return table.getData().map(row => {
      const newRow: any = {};
      for (const key in row) {
        if (row[key] === null || row[key] === undefined) {
          newRow[key] = '';
        } else if (row[key] instanceof Date) {
          newRow[key] = moment(row[key]).format('YYYY-MM-DD');
        } else {
          newRow[key] = String(row[key]);
        }
      }
      return newRow;
    });
  } catch (e) {
    console.error(`Warning: Failed to load table ${tableName}`, e);
    return [];
  }
}

const normCode = (val: any) => (val || '').toString().trim().toUpperCase();

console.log("[1/7] Loading source tables from Access ...");
let pat = loadTable("pat_code");
let wc = loadTable("wrk_comp");
let det = loadTable("wrk_comp_Detail");
let rx = loadTable("Wrk_Prescription");
let pay = loadTable("act_tran_link");
let fee = loadTable("Wrk_fee");
const doc = loadTable("doc_mst");
const grp = loadTable("Pat_Group");

console.log(`patients=${pat.length} visits=${wc.length} tooth_lines=${det.length} rx_lines=${rx.length} payments=${pay.length}`);

console.log("[2/7] Normalising patient codes (TRIM + UPPERCASE) ...");
pat.forEach(r => r._key = normCode(r.pcode));
wc.forEach(r => r._key = normCode(r.pat_code));
pay.forEach(r => r._key = normCode(r.pat_code));
fee.forEach(r => r._key = normCode(r.pat_code));

console.log("[3/7] Re-keying duplicate visit IDs ...");
let maxId = 0;
wc.forEach(r => {
  const idNum = parseInt(r.Wrk_done_id) || 0;
  if (idNum > maxId) maxId = idNum;
});

const seenWrkIds = new Set();
let duplicates = 0;
wc.forEach(r => {
  if (seenWrkIds.has(r.Wrk_done_id)) {
    maxId++;
    r.Wrk_done_id = String(maxId);
    duplicates++;
  } else {
    seenWrkIds.add(r.Wrk_done_id);
  }
});
console.log(`duplicate Wrk_done_id rows re-keyed: ${duplicates}`);

console.log("[4/7] Aggregating tooth details and prescriptions per visit ...");
const detAgg: any = {};
det.forEach(r => {
  const row_tooth = (r.ToothNo || '').toString().trim();
  const row_name = (r.ToothName || '').toString().trim();
  const row_done = (r.Wrk_Done || '').toString().trim();
  const row_sp = (r.Sp_Notes || '').toString().trim();

  const bodyParts = [];
  if (row_done) bodyParts.push(row_done);
  if (row_sp) bodyParts.push(row_sp);
  const body = bodyParts.join(" ").replace(/\n/g, " ").trim();

  let line = "";
  if (row_tooth) {
    const label = `[${row_tooth}] ${row_name}`.trim();
    line = body ? `${label}: ${body}`.replace(/: $/, '') : label;
  } else {
    line = body;
  }

  const is_tooth = row_tooth !== "";

  if (!detAgg[r.Wrk_done_id]) detAgg[r.Wrk_done_id] = { Treatments: [], Teeth_Count: 0, doc_code: null };
  if (line.trim()) {
    detAgg[r.Wrk_done_id].Treatments.push(line.trim());
  }
  if (is_tooth) {
    detAgg[r.Wrk_done_id].Teeth_Count++;
  }
  if (r.Doc_Code && r.Doc_Code !== '0') detAgg[r.Wrk_done_id].doc_code = r.Doc_Code;
});

const rxAgg: any = {};
rx.forEach(r => {
  const med = `${r.BrandName || ''} (${r.Dosage || ''}, ${r.Days || ''} days)`.trim();
  if (!rxAgg[r.Wrk_done_id]) rxAgg[r.Wrk_done_id] = { Prescriptions: [], Rx_Count: 0 };
  if (med.replace(/\(\s*,\s*days\)/, '').trim()) {
    rxAgg[r.Wrk_done_id].Prescriptions.push(med);
    rxAgg[r.Wrk_done_id].Rx_Count++;
  }
});

console.log("[5/7] Summing fees & payments and resolving lookups ...");
const payAgg: any = {};
pay.forEach(r => {
  const key = `${r._key}_${r.wrk_date}`;
  if (!payAgg[key]) payAgg[key] = { Amount_Paid: 0, Payment_Modes: new Set(), Doctor: '' };
  payAgg[key].Amount_Paid += parseFloat(r.amt || 0) || 0;
  if ((r.paidAs || '').trim()) payAgg[key].Payment_Modes.add(r.paidAs.trim());
  if (r.dr && r.dr.trim()) payAgg[key].Doctor = r.dr.trim();
});

const feeAgg: any = {};
fee.forEach(r => {
  const key = `${r._key}_${r.wrk_date}`;
  if (!feeAgg[key]) feeAgg[key] = { Fee_Due: 0, Fee_Discount: 0, doc_code: null };
  feeAgg[key].Fee_Due += parseFloat(r.fee_due || 0) || 0;
  feeAgg[key].Fee_Discount += parseFloat(r.fee_dis || 0) || 0;
  if (r.Doc_Code && r.Doc_Code !== '0') feeAgg[key].doc_code = r.Doc_Code;
});

const docMap: any = {};
doc.forEach(r => docMap[r.code] = r.name);

const grpMap: any = {};
grp.forEach(r => grpMap[r.GroupID] = r.GroupName);

console.log("[6/7] Joining patients to visits (left join keeps everyone) ...");
const stageMap: any = { "F": "Finished", "P": "In Progress" };

wc.forEach(r => {
  const pdKey = `${r._key}_${r.wrk_date}`;

  let dName = docMap[r.doc_code];
  if (!dName || dName.trim() === '') dName = docMap[detAgg[r.Wrk_done_id]?.doc_code];
  if (!dName || dName.trim() === '') dName = docMap[feeAgg[pdKey]?.doc_code];
  if (!dName || dName.trim() === '') dName = payAgg[pdKey]?.Doctor;
  r.Doctor = dName || '';

  r.Treatment_Stage = stageMap[r.treat_stage] || r.treat_stage || '';
  r.Teeth_Count = detAgg[r.Wrk_done_id]?.Teeth_Count || 0;
  r.Treatments = (detAgg[r.Wrk_done_id]?.Treatments || []).join(' | ');
  r.Prescriptions = (rxAgg[r.Wrk_done_id]?.Prescriptions || []).join(' | ');
  
  r.Amount_Paid_Raw = payAgg[pdKey]?.Amount_Paid || 0;
  r.Payment_Modes_Raw = Array.from(payAgg[pdKey]?.Payment_Modes || []).sort().join(', ');
  r.Fee_Due_Raw = feeAgg[pdKey]?.Fee_Due || 0;
  r.Fee_Discount_Raw = feeAgg[pdKey]?.Fee_Discount || 0;
});

wc.sort((a, b) => {
  if (a._key !== b._key) return a._key.localeCompare(b._key);
  if (a.wrk_date !== b.wrk_date) return a.wrk_date.localeCompare(b.wrk_date);
  return a.Wrk_done_id.localeCompare(b.Wrk_done_id);
});

const seenDay = new Set();
wc.forEach(r => {
  const dayKey = `${r._key}_${r.wrk_date}`;
  if (!seenDay.has(dayKey)) {
    seenDay.add(dayKey);
    r.Amount_Paid = r.Amount_Paid_Raw;
    r.Fee_Due = r.Fee_Due_Raw;
    r.Fee_Discount = r.Fee_Discount_Raw;
    r.Payment_Modes = r.Payment_Modes_Raw;
  } else {
    r.Amount_Paid = 0;
    r.Fee_Due = 0;
    r.Fee_Discount = 0;
    r.Payment_Modes = '';
  }
});

const patClean = pat.reduce((acc, r) => {
  if (!acc.has(r._key)) {
    acc.set(r._key, {
      _key: r._key,
      Patient_Code: r.pcode,
      Patient_Name: `${r.f_name || ''} ${r.l_name || ''}`.trim(),
      Sex: r.sex || '',
      Age: r.age || '',
      Phone: [r.ph_1, r.ph_2, r.ph_3, r.ph_4].filter(x => (x || '').trim()).join(', '),
      Email: r.e_mail || '',
      Address: `${r.r_add_1 || ''} ${r.r_add_2 || ''}, ${r.r_city || ''}`.replace(/^ ,| ,$/g, '').trim(),
      Group: grpMap[r.GroupID] || '',
      Registered_On: r.reg_date || '',
      Referred_By: r.ref_by || ''
    });
  }
  return acc;
}, new Map());

const wcByPat: any = {};
wc.forEach(r => {
  if (!wcByPat[r._key]) wcByPat[r._key] = [];
  wcByPat[r._key].push(r);
});

let flatData: any[] = [];
patClean.forEach((pInfo: any) => {
  const visits = wcByPat[pInfo._key] || [];
  if (visits.length === 0) {
    flatData.push({ ...pInfo, Work_ID: '' });
  } else {
    visits.forEach((v: any) => {
      flatData.push({
        ...pInfo,
        Work_Date: v.wrk_date || '',
        Doctor: v.Doctor,
        Treatment_Stage: v.Treatment_Stage,
        Teeth_Count: v.Teeth_Count,
        Treatments: v.Treatments,
        Prescriptions: v.Prescriptions,
        Fee_Due: v.Fee_Due,
        Fee_Discount: v.Fee_Discount,
        Amount_Paid: v.Amount_Paid,
        Payment_Modes: v.Payment_Modes,
        Work_ID: v.Wrk_done_id
      });
    });
  }
});

flatData.forEach(r => {
  if (r.Registered_On) r.Registered_On = moment(r.Registered_On, ['YYYY-MM-DD', 'DD/MM/YYYY']).format('YYYY-MM-DD');
  if (r.Work_Date) r.Work_Date = moment(r.Work_Date, ['YYYY-MM-DD', 'DD/MM/YYYY']).format('YYYY-MM-DD');
  
  ['Treatments', 'Prescriptions', 'Payment_Modes', 'Doctor', 'Treatment_Stage', 'Work_Date', 'Work_ID', 'Registered_On']
    .forEach(k => r[k] = r[k] === undefined ? '' : r[k]);
  
  ['Amount_Paid', 'Fee_Due', 'Fee_Discount', 'Teeth_Count']
    .forEach(k => r[k] = parseFloat(r[k]) || 0);
});

flatData.sort((a, b) => {
  const nameCmp = a.Patient_Name.localeCompare(b.Patient_Name);
  if (nameCmp !== 0) return nameCmp;
  const da = a.Work_Date ? new Date(a.Work_Date).getTime() : 0;
  const db = b.Work_Date ? new Date(b.Work_Date).getTime() : 0;
  return da - db;
});

console.log(`final rows=${flatData.length}`);

console.log("[7/7] Writing formatted Excel workbook ...");
async function writeExcel() {
  const workbook = new ExcelJS.Workbook();
  
  const wsSummary = workbook.addWorksheet('Summary');
  const wsHistory = workbook.addWorksheet('Patient_History');

  const cols = [
    { header: 'Patient_Code', key: 'Patient_Code', width: 16 },
    { header: 'Patient_Name', key: 'Patient_Name', width: 22 },
    { header: 'Sex', key: 'Sex', width: 5 },
    { header: 'Age', key: 'Age', width: 5 },
    { header: 'Phone', key: 'Phone', width: 22 },
    { header: 'Email', key: 'Email', width: 22 },
    { header: 'Address', key: 'Address', width: 34 },
    { header: 'Group', key: 'Group', width: 10 },
    { header: 'Registered_On', key: 'Registered_On', width: 13 },
    { header: 'Referred_By', key: 'Referred_By', width: 16 },
    { header: 'Work_Date', key: 'Work_Date', width: 12 },
    { header: 'Doctor', key: 'Doctor', width: 18 },
    { header: 'Treatment_Stage', key: 'Treatment_Stage', width: 14 },
    { header: 'Teeth_Count', key: 'Teeth_Count', width: 8 },
    { header: 'Treatments', key: 'Treatments', width: 50 },
    { header: 'Prescriptions', key: 'Prescriptions', width: 42 },
    { header: 'Fee_Due', key: 'Fee_Due', width: 10 },
    { header: 'Fee_Discount', key: 'Fee_Discount', width: 11 },
    { header: 'Amount_Paid', key: 'Amount_Paid', width: 12 },
    { header: 'Payment_Modes', key: 'Payment_Modes', width: 16 },
    { header: 'Work_ID', key: 'Work_ID', width: 10 }
  ];

  wsHistory.columns = cols;
  wsHistory.addRows(flatData);

  wsHistory.getRow(1).font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
  wsHistory.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
  
  wsHistory.eachRow((row, rowNumber) => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
      };
      if (rowNumber > 1) {
        cell.font = { name: 'Arial', size: 10 };
        const colKey = cols[Number(cell.col) - 1]?.key || '';
        cell.alignment = { vertical: 'top', wrapText: ['Treatments', 'Prescriptions', 'Address'].includes(colKey) };
        if (rowNumber % 2 !== 0) { // odd excel row, but > 1, i.e., data row 2 (excel row 3)
           cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF3F8' } };
        }
      }
    });
  });

  wsHistory.views = [{ state: 'frozen', ySplit: 1 }];
  wsHistory.autoFilter = 'A1:U1';

  // Summary sheet
  let totalFeeDue = 0, totalAmountPaid = 0;
  flatData.forEach(r => {
    totalFeeDue += r.Fee_Due || 0;
    totalAmountPaid += r.Amount_Paid || 0;
  });
  
  const works = flatData.filter(r => r.Work_ID !== '');
  
  let dates = works.map(r => r.Work_Date).filter(d => !!d).sort();
  let minDate = dates[0] || '';
  let maxDate = dates[dates.length-1] || '';

  const summaryRows = [
    ['DentalCare — Patient History Flat File', ''],
    ['Grain', 'One row per completed work event; patients with no history appear once with blank visit fields'],
    ['', ''],
    ['Total patients', Object.keys(wcByPat).length], // Actually use patClean size
    ['Total rows', flatData.length],
    ['Rows with a work event', works.length],
    ['Patients with no recorded history', flatData.length - works.length],
    ['Work date range', `${minDate} to ${maxDate}`],
    ['Total Fee Due', totalFeeDue],
    ['Total Amount Paid', totalAmountPaid],
    ['', ''],
    ['How to use', 'The Patient_History tab is an Excel Table — click any header dropdown to filter. Filter Patient_Code or Patient_Name to see one patient\'s full history in date order.'],
    ['Join keys', 'Patient = pat_code.pcode (normalised TRIM+UPPER); Work plan = Wrk_done_id chain (wrk_comp -> wrk_comp_Detail / Wrk_Prescription).'],
    ['Corrections applied', '2 duplicate Wrk_done_id rows re-keyed; legacy patient table ignored; tooth detail & meds aggregated per visit; payments summed per patient+date and shown once (not repeated across same-day visits, so totals are exact).']
  ];
  
  summaryRows[3][1] = patClean.size;

  wsSummary.addRows(summaryRows);
  wsSummary.columns = [{ width: 34 }, { width: 80 }];

  wsSummary.getCell('A1').font = { name: 'Arial', bold: true, size: 13, color: { argb: 'FF1F4E78' } };
  for(let i=4; i<=summaryRows.length; i++) {
    wsSummary.getCell(`A${i}`).font = { name: 'Arial', bold: true, size: 10 };
    wsSummary.getCell(`B${i}`).font = { name: 'Arial', size: 10 };
    wsSummary.getCell(`B${i}`).alignment = { wrapText: true, vertical: 'top' };
  }
  
  workbook.views = [{ activeTab: 0 } as any];
  
  await workbook.xlsx.writeFile(outPath);
  console.log(`\nDone. Saved -> ${outPath} (${flatData.length} rows)`);
}

writeExcel().catch(console.error);

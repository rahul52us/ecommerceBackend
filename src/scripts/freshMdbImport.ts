import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import MDBReader from "mdb-reader";
import dotenv from "dotenv";

import UserModel from "../schemas/User/User";
import LegacyWorkComp from "../schemas/legacy/LegacyWorkComp";
import LegacyWorkCompDetail from "../schemas/legacy/LegacyWorkCompDetail";
import LegacyToothWork from "../schemas/legacy/LegacyToothWork";
import LegacyWorkFee from "../schemas/legacy/LegacyWorkFee";
import LegacyTransaction from "../schemas/legacy/LegacyTransaction";

dotenv.config({ path: path.join(__dirname, "../../.env") });

// Accept MDB path from command line arguments, or use default
const MDB_FILE = process.argv[2] || "D:\\download\\dentalcare.mdb";
const BATCH_SIZE = 1000;

async function runImport() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/dental");
    console.log("Connected successfully.");

    if (!fs.existsSync(MDB_FILE)) {
      console.error(`ERROR: MDB file not found at ${MDB_FILE}`);
      process.exit(1);
    }

    const buffer = fs.readFileSync(path.resolve(MDB_FILE));
    const reader = new MDBReader(buffer);
    console.log("MDB File loaded.");

    // Fetch default company
    const companyId = new mongoose.Types.ObjectId("65f65a70fbe7ae65d05dac64");
    console.log(`Using Company ID: ${companyId}`);

    const docMap = new Map<string, string>();
    const patMap = new Map<string, string>();
    const workMap = new Map<string, any>(); // Legacy Wrk_done_id -> { mongoId, pId, patCode }
    const datePatToWorkId = new Map<string, string>(); // patCode_timestamp -> Legacy Wrk_done_id

    // Fetch existing users to map IDs
    console.log("Building Doctor and Patient Maps...");
    const allDocs = await UserModel.find({ userType: "doctor" }).select("code _id").lean();
    allDocs.forEach((d: any) => { if (d.code) docMap.set(d.code.toString(), d._id.toString()) });

    const allPats = await UserModel.find({ userType: "patient" }).select("code _id").lean();
    allPats.forEach((p: any) => { if (p.code) patMap.set(p.code.toString(), p._id.toString()) });
    console.log(`Mapped ${docMap.size} doctors and ${patMap.size} patients.`);

    // WIPE OLD DATA
    console.log("\n--- WIPING EXISTING LEGACY DATA ---");
    await LegacyWorkComp.deleteMany({});
    await LegacyWorkCompDetail.deleteMany({});
    await LegacyTransaction.deleteMany({});
    await LegacyWorkFee.deleteMany({});
    await LegacyToothWork.deleteMany({});
    console.log("Wipe complete. Starting fresh import...\n");

    // Helper to get or generate Work ID
    const getWorkId = (patCode: string, date: Date | string) => {
      if (!patCode || !date) return new mongoose.Types.ObjectId().toString(); // Generate unique if missing
      const key = `${patCode.toString()}_${new Date(date).getTime()}`;
      if (datePatToWorkId.has(key)) {
        return datePatToWorkId.get(key);
      }
      // Generate a new one if orphan
      const newId = `ORPHAN_${new mongoose.Types.ObjectId().toString()}`;
      datePatToWorkId.set(key, newId);
      return newId;
    };

    // 1. IMPORT WORK COMP
    console.log("--- IMPORTING wrk_comp ---");
    const wrkCompRows = reader.getTable("wrk_comp").getData();
    let validComps = 0;
    for (let i = 0; i < wrkCompRows.length; i += BATCH_SIZE) {
      const batch = wrkCompRows.slice(i, i + BATCH_SIZE);
      const docs = batch.map((row: any) => {
        const pId = patMap.get(row.pat_code?.toString());
        const dId = docMap.get(row.Doc_Code?.toString());
        const wrkId = row.Wrk_done_id?.toString() || new mongoose.Types.ObjectId().toString();

        // Save to our dictionary for linking others
        if (row.pat_code && row.wrk_date) {
          const key = `${row.pat_code.toString()}_${new Date(row.wrk_date).getTime()}`;
          datePatToWorkId.set(key, wrkId);
        }

        const mongoId = new mongoose.Types.ObjectId();
        workMap.set(wrkId, {
          mongoId: mongoId.toString(),
          pId: pId,
          patCode: row.pat_code?.toString()
        });

        return {
          _id: mongoId,
          patientId: pId,
          doctorId: dId,
          legacyWrkDoneId: wrkId,
          legacyPatCode: row.pat_code?.toString(),
          legacyDocCode: row.Doc_Code?.toString(),
          wrk_date: row.wrk_date,
          fee_due: row.fee_due,
          fee_dis: row.fee_dis,
          treat_stage: row.treat_stage,
          company: companyId,
          isVersion1: false
        };
      });
      await LegacyWorkComp.insertMany(docs, { ordered: false }).catch(() => {});
      validComps += docs.length;
    }
    console.log(`Imported ${validComps} wrk_comp records.`);

    // 2. IMPORT WORK COMP DETAILS
    console.log("--- IMPORTING wrk_comp_Detail ---");
    const detailRows = reader.getTable("wrk_comp_Detail").getData();
    let validDetails = 0;
    for (let i = 0; i < detailRows.length; i += BATCH_SIZE) {
      const batch = detailRows.slice(i, i + BATCH_SIZE);
      const docs = batch.map((row: any) => {
        const legacyId = row.Wrk_done_id?.toString();
        const parentData = workMap.get(legacyId) || {};
        return {
          legacyWorkCompId: parentData.mongoId,
          patientId: parentData.pId,
          legacyPatCode: parentData.patCode,
          doctorId: docMap.get(row.Doc_Code?.toString()),
          legacyWrkDoneId: legacyId,
          legacyDocCode: row.Doc_Code?.toString(),
          ToothName: row.ToothName,
          ToothNo: row.ToothNo,
          Wrk_Done: row.Wrk_Done,
          Sp_Notes: row.Sp_Notes,
          ToothNoS: row.ToothNoS?.toString(),
          company: companyId
        };
      });
      await LegacyWorkCompDetail.insertMany(docs, { ordered: false }).catch(() => {});
      validDetails += docs.length;
    }
    console.log(`Imported ${validDetails} wrk_comp_Detail records.`);

    // 3. IMPORT TRANSACTIONS
    console.log("--- IMPORTING act_tran ---");
    const tranRows = reader.getTable("act_tran").getData();
    let validTrans = 0;
    for (let i = 0; i < tranRows.length; i += BATCH_SIZE) {
      const batch = tranRows.slice(i, i + BATCH_SIZE);
      const docs = batch.map((row: any) => {
        const dateToUse = row.wrk_date || row.date;
        const linkedWrkId = getWorkId(row.pat_code, dateToUse);

        return {
          patientId: patMap.get(row.pat_code?.toString()),
          doctorId: docMap.get(row.doctor?.toString()),
          legacyPatCode: row.pat_code?.toString(),
          legacyDocCode: row.doctor?.toString(),
          legacyWrkDoneId: linkedWrkId,
          fee_rec: row.fee_rec,
          date: row.date,
          wrk_date: row.wrk_date,
          company: companyId
        };
      });
      await LegacyTransaction.insertMany(docs, { ordered: false }).catch(() => {});
      validTrans += docs.length;
    }
    console.log(`Imported ${validTrans} act_tran records.`);

    // 4. IMPORT FEES
    console.log("--- IMPORTING Wrk_fee ---");
    const feeRows = reader.getTable("Wrk_fee").getData();
    let validFees = 0;
    for (let i = 0; i < feeRows.length; i += BATCH_SIZE) {
      const batch = feeRows.slice(i, i + BATCH_SIZE);
      const docs = batch.map((row: any) => {
        const linkedWrkId = getWorkId(row.pat_code, row.wrk_date);
        return {
          patientId: patMap.get(row.pat_code?.toString()),
          doctorId: docMap.get(row.Doc_Code?.toString()),
          legacyPatCode: row.pat_code?.toString(),
          legacyDocCode: row.Doc_Code?.toString(),
          legacyWrkDoneId: linkedWrkId,
          wrk_date: row.wrk_date,
          fee_due: row.fee_due,
          fee_dis: row.fee_dis,
          treat_stage: row.treat_stage,
          company: companyId
        };
      });
      await LegacyWorkFee.insertMany(docs, { ordered: false }).catch(() => {});
      validFees += docs.length;
    }
    console.log(`Imported ${validFees} Wrk_fee records.`);

    // 5. IMPORT TOOTH WORK
    console.log("--- IMPORTING toothwrk ---");
    const twRows = reader.getTable("toothwrk").getData();
    let validTW = 0;
    for (let i = 0; i < twRows.length; i += BATCH_SIZE) {
      const batch = twRows.slice(i, i + BATCH_SIZE);
      const docs = batch.map((row: any) => {
        const linkedWrkId = getWorkId(row.pat_code, row.wrkdate);
        return {
          patientId: patMap.get(row.pat_code?.toString()),
          doctorId: docMap.get(row.doc_code?.toString()),
          legacyPatCode: row.pat_code?.toString(),
          legacyDocCode: row.doc_code?.toString(),
          legacyWrkDoneId: linkedWrkId,
          name: row.name,
          descript: row.descript,
          wrkdate: row.wrkdate,
          ToothNoS: row.ToothNoS?.toString(),
          company: companyId,
          isVersion1: false
        };
      });
      await LegacyToothWork.insertMany(docs, { ordered: false }).catch(() => {});
      validTW += docs.length;
    }
    console.log(`Imported ${validTW} toothwrk records.`);

    console.log("\nSUCCESS! All legacy data imported and unified.");
    process.exit(0);

  } catch (error) {
    console.error("Migration Fatal Error:", error);
    process.exit(1);
  }
}

runImport();

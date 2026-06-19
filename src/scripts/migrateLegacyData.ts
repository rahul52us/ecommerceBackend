import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import MDBReader from "mdb-reader";
import UserModel from "../schemas/User/User";
import ProfileDetails from "../schemas/User/ProfileDetails";
import LegacyWorkComp from "../schemas/legacy/LegacyWorkComp";
import LegacyWorkCompDetail from "../schemas/legacy/LegacyWorkCompDetail";
import LegacyToothWork from "../schemas/legacy/LegacyToothWork";
import LegacyWorkFee from "../schemas/legacy/LegacyWorkFee";
import LegacyTransaction from "../schemas/legacy/LegacyTransaction";
import dotenv from "dotenv";

dotenv.config();

const MDB_FILE = "D:\\download\\dentalcare.mdb";
const ONE_YEAR_AGO = new Date();
ONE_YEAR_AGO.setFullYear(ONE_YEAR_AGO.getFullYear() - 1);

const BATCH_SIZE = 1000;

const docMap = new Map<string, string>(); // legacy doc_code -> mongo _id
const patMap = new Map<string, string>(); // legacy pat_code -> mongo _id
const workMap = new Map<string, string>(); // legacy Wrk_done_id -> mongo _id

async function migrateDoctors(reader: any) {
  console.log("--- Migrating Doctors ---");

  const docRows = reader.getTable("doc_mst").getData();
  console.log(`Found ${docRows.length} doctors to insert.`);

  if (docRows.length > 0) {
    const userDocs = docRows.map((row: any) => ({
      _id: new mongoose.Types.ObjectId(),
      name: row.name || "Unknown Doctor",
      code: row.code ? row.code.toString() : new mongoose.Types.ObjectId().toString(),
      userType: "doctor",
      password: "Admin@123",
      previousRecord: true,
      createdAt: ONE_YEAR_AGO,
      updatedAt: ONE_YEAR_AGO
    }));

    const profileDocs = docRows.map((row: any, idx: number) => ({
      user: userDocs[idx]._id,
      personalInfo: { ...row },
      previousRecord: true
    }));

    await UserModel.insertMany(userDocs, { ordered: false });
    await ProfileDetails.insertMany(profileDocs, { ordered: false });

    docRows.forEach((row: any, idx: number) => {
        if (row.code) docMap.set(row.code.toString(), userDocs[idx]._id.toString());
    });
  }
  
  console.log("Re-fetching all doctors from DB to build map for work records...");
  const allDocs = await UserModel.find({ userType: "doctor" }).select("code _id").lean();
  allDocs.forEach((d: any) => { if (d.code) docMap.set(d.code.toString(), d._id.toString()) });

  console.log("Doctors Migration Complete.");
}

async function migratePatients(reader: any) {
  console.log("--- Migrating Patients ---");
  const patRows = reader.getTable("pat_code").getData();

  console.log(`Found ${patRows.length} patients to insert.`);

  for (let i = 0; i < patRows.length; i += BATCH_SIZE) {
    const batch = patRows.slice(i, i + BATCH_SIZE);
    
    const userDocs = batch.map((row: any) => ({
      _id: new mongoose.Types.ObjectId(),
      name: `${row.f_name || ''} ${row.l_name || ''}`.trim() || 'Unknown',
      code: row.pcode ? row.pcode.toString() : new mongoose.Types.ObjectId().toString(),
      mobileNumber: row.ph_1 || '',
      userType: "patient",
      password: "Admin@123",
      previousRecord: true,
      createdAt: ONE_YEAR_AGO,
      updatedAt: ONE_YEAR_AGO
    }));

    const profileDocs = batch.map((row: any, idx: number) => ({
      user: userDocs[idx]._id,
      personalInfo: {
        ...row,
        name: userDocs[idx].name,
        code: userDocs[idx].code,
        mobileNumber: userDocs[idx].mobileNumber,
        userType: "patient"
      },
      previousRecord: true
    }));

    await UserModel.insertMany(userDocs, { ordered: false }).catch(e => console.error("Batch insert warning"));
    await ProfileDetails.insertMany(profileDocs, { ordered: false }).catch(e => console.error("Batch profile warning"));

    batch.forEach((row: any, idx: number) => {
        if (row.pcode) patMap.set(row.pcode.toString(), userDocs[idx]._id.toString());
    });
    console.log(`Inserted ${Math.min(i + BATCH_SIZE, patRows.length)} / ${patRows.length} patients.`);
  }
  
  console.log("Re-fetching all patients from DB to build map for work records...");
  const allPats = await UserModel.find({ userType: "patient" }).select("code _id").lean();
  allPats.forEach((p: any) => { if (p.code) patMap.set(p.code.toString(), p._id.toString()) });
  
  console.log("Patients Migration Complete.");
}

async function migrateTable(reader: any, tableName: string, Model: any, mapRow: (row: any) => any, isVersion1 = false) {
  console.log(`--- Migrating ${tableName} ---`);
  
  // Clean existing data for this table if we want a fresh run, but let's assume we just insert new if not found, 
  // or we just wipe legacy collection since they are isolated anyway.
  // For safety, we will just insert everything and assume it's a fresh run for legacy tables.
  await Model.deleteMany({ isVersion1 });

  const rows = reader.getTable(tableName).getData();
  console.log(`Found ${rows.length} records in ${tableName}.`);

  let validRows = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const docs = [];

    for (const row of batch) {
      const mapped = mapRow(row);
      if (mapped) {
        docs.push(mapped);
        validRows++;
      }
    }

    if (docs.length > 0) {
      const inserted = await Model.insertMany(docs, { ordered: false }).catch((e: any) => {
         console.error(`Batch insert warning in ${tableName}`);
         return e.insertedDocs || [];
      });
      
      // Store work IDs for details mapping
      if (tableName === 'wrk_comp' && inserted && Array.isArray(inserted)) {
         inserted.forEach((doc: any) => {
             if (doc.legacyWrkDoneId) {
                 workMap.set(doc.legacyWrkDoneId.toString(), doc._id.toString());
             }
         });
      }
    }

    console.log(`Processed ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length} records.`);
  }
  
  console.log(`${tableName} Migration Complete. Inserted ${validRows} records.`);
}

async function startMigration() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/dentalbackend");
    console.log("Connected to MongoDB.");

    console.log("Reading MDB File...");
    const buffer = fs.readFileSync(path.resolve(MDB_FILE));
    const reader = new MDBReader(buffer);

    // 1. Core Users
    await migrateDoctors(reader);
    await migratePatients(reader);

    // 2. Legacy Data
    await migrateTable(reader, "wrk_comp", LegacyWorkComp, (row: any) => {
      const pId = patMap.get(row.pat_code?.toString());
      if (!pId) return null; // Skip orphans
      const dId = docMap.get(row.Doc_Code?.toString());
      return {
        _id: new mongoose.Types.ObjectId(),
        patientId: pId,
        doctorId: dId,
        legacyWrkDoneId: row.Wrk_done_id?.toString(),
        legacyPatCode: row.pat_code?.toString(),
        legacyDocCode: row.Doc_Code?.toString(),
        wrk_date: row.wrk_date,
        fee_due: row.fee_due,
        fee_dis: row.fee_dis,
        treat_stage: row.treat_stage,
        isVersion1: false
      };
    });

    await migrateTable(reader, "wrk_comp1", LegacyWorkComp, (row: any) => {
      const pId = patMap.get(row.pat_code?.toString());
      if (!pId) return null;
      const dId = docMap.get(row.doc_code?.toString());
      return {
        patientId: pId,
        doctorId: dId,
        legacyPatCode: row.pat_code?.toString(),
        legacyDocCode: row.doc_code?.toString(),
        wrk_date: row.wrk_date,
        fee_due: row.fee_due,
        fee_dis: row.fee_dis,
        treat_stage: row.treat_stage,
        isVersion1: true
      };
    }, true);

    await migrateTable(reader, "wrk_comp_Detail", LegacyWorkCompDetail, (row: any) => {
      const wId = workMap.get(row.Wrk_done_id?.toString());
      const dId = docMap.get(row.Doc_Code?.toString());
      return {
        legacyWorkCompId: wId,
        doctorId: dId,
        legacyWrkDoneId: row.Wrk_done_id?.toString(),
        legacyDocCode: row.Doc_Code?.toString(),
        ToothName: row.ToothName,
        ToothNo: row.ToothNo,
        Wrk_Done: row.Wrk_Done,
        Sp_Notes: row.Sp_Notes,
        ToothNoS: row.ToothNoS?.toString(),
      };
    });

    await migrateTable(reader, "toothwrk", LegacyToothWork, (row: any) => {
      const pId = patMap.get(row.pat_code?.toString());
      if (!pId) return null;
      const dId = docMap.get(row.doc_code?.toString());
      return {
        patientId: pId,
        doctorId: dId,
        legacyPatCode: row.pat_code?.toString(),
        legacyDocCode: row.doc_code?.toString(),
        name: row.name,
        descript: row.descript,
        wrkdate: row.wrkdate,
        ToothNoS: row.ToothNoS?.toString(),
        isVersion1: false
      };
    });

    await migrateTable(reader, "toothwrk1", LegacyToothWork, (row: any) => {
      const pId = patMap.get(row.pat_code?.toString());
      if (!pId) return null;
      return {
        patientId: pId,
        legacyPatCode: row.pat_code?.toString(),
        name: row.name,
        descript: row.descript,
        wrkdate: row.wrkdate,
        isVersion1: true
      };
    }, true);

    await migrateTable(reader, "Wrk_fee", LegacyWorkFee, (row: any) => {
      const pId = patMap.get(row.pat_code?.toString());
      if (!pId) return null;
      const dId = docMap.get(row.Doc_Code?.toString());
      return {
        patientId: pId,
        doctorId: dId,
        legacyPatCode: row.pat_code?.toString(),
        legacyDocCode: row.Doc_Code?.toString(),
        wrk_date: row.wrk_date,
        fee_due: row.fee_due,
        fee_dis: row.fee_dis,
        treat_stage: row.treat_stage,
      };
    });

    await migrateTable(reader, "act_tran", LegacyTransaction, (row: any) => {
      const pId = patMap.get(row.pat_code?.toString());
      if (!pId) return null;
      const dId = docMap.get(row.doctor?.toString());
      return {
        patientId: pId,
        doctorId: dId,
        legacyPatCode: row.pat_code?.toString(),
        legacyDocCode: row.doctor?.toString(),
        fee_rec: row.fee_rec,
        date: row.date,
        wrk_date: row.wrk_date,
      };
    });

    console.log("--- MIGRATION COMPLETELY FINISHED! ---");
    process.exit(0);

  } catch (err) {
    console.error("Migration Error:", err);
    process.exit(1);
  }
}

startMigration();

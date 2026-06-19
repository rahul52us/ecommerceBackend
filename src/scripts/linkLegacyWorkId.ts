import mongoose from "mongoose";
import dotenv from "dotenv";
import LegacyWorkComp from "../schemas/legacy/LegacyWorkComp";
import LegacyTransaction from "../schemas/legacy/LegacyTransaction";
import LegacyWorkFee from "../schemas/legacy/LegacyWorkFee";
import LegacyToothWork from "../schemas/legacy/LegacyToothWork";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://admin:pass@cluster.mongodb.net/test";

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB Atlas.");

    // Fetch all WorkComps and build an in-memory map for fast lookups
    // Map key: legacyPatCode_wrk_date (date as timestamp string)
    console.log("Building in-memory map of WorkComps...");
    const workComps = await LegacyWorkComp.find({ legacyWrkDoneId: { $exists: true } }, { legacyPatCode: 1, wrk_date: 1, legacyWrkDoneId: 1 }).lean();
    
    const workCompMap = new Map<string, string>();
    for (const comp of workComps) {
      if (comp.legacyPatCode && comp.wrk_date) {
        const key = `${comp.legacyPatCode}_${new Date(comp.wrk_date).getTime()}`;
        workCompMap.set(key, comp.legacyWrkDoneId);
      }
    }
    console.log(`Map built with ${workCompMap.size} unique keys.`);

    // 1. Update LegacyTransaction
    console.log("Updating LegacyTransaction...");
    const transactions = await LegacyTransaction.find({ legacyWrkDoneId: { $exists: false } }).lean();
    let tranOps = [];
    for (const tran of transactions) {
      const date = tran.wrk_date || tran.date;
      if (tran.legacyPatCode && date) {
        const key = `${tran.legacyPatCode}_${new Date(date).getTime()}`;
        const wrkId = workCompMap.get(key);
        if (wrkId) {
          tranOps.push({
            updateOne: {
              filter: { _id: tran._id },
              update: { $set: { legacyWrkDoneId: wrkId } }
            }
          });
        }
      }
      
      if (tranOps.length === 1000) {
        await LegacyTransaction.bulkWrite(tranOps);
        tranOps = [];
      }
    }
    if (tranOps.length > 0) await LegacyTransaction.bulkWrite(tranOps);
    console.log(`Transactions updated.`);

    // 2. Update LegacyWorkFee
    console.log("Updating LegacyWorkFee...");
    const fees = await LegacyWorkFee.find({ legacyWrkDoneId: { $exists: false } }).lean();
    let feeOps = [];
    for (const fee of fees) {
      if (fee.legacyPatCode && fee.wrk_date) {
        const key = `${fee.legacyPatCode}_${new Date(fee.wrk_date).getTime()}`;
        const wrkId = workCompMap.get(key);
        if (wrkId) {
          feeOps.push({
            updateOne: {
              filter: { _id: fee._id },
              update: { $set: { legacyWrkDoneId: wrkId } }
            }
          });
        }
      }
      if (feeOps.length === 1000) {
        await LegacyWorkFee.bulkWrite(feeOps);
        feeOps = [];
      }
    }
    if (feeOps.length > 0) await LegacyWorkFee.bulkWrite(feeOps);
    console.log(`WorkFees updated.`);

    // 3. Update LegacyToothWork
    console.log("Updating LegacyToothWork...");
    const toothworks = await LegacyToothWork.find({ legacyWrkDoneId: { $exists: false } }).lean();
    let twOps = [];
    for (const tw of toothworks) {
      if (tw.legacyPatCode && tw.wrkdate) {
        const key = `${tw.legacyPatCode}_${new Date(tw.wrkdate).getTime()}`;
        const wrkId = workCompMap.get(key);
        if (wrkId) {
          twOps.push({
            updateOne: {
              filter: { _id: tw._id },
              update: { $set: { legacyWrkDoneId: wrkId } }
            }
          });
        }
      }
      if (twOps.length === 1000) {
        await LegacyToothWork.bulkWrite(twOps);
        twOps = [];
      }
    }
    if (twOps.length > 0) await LegacyToothWork.bulkWrite(twOps);
    console.log(`ToothWork updated.`);

    console.log("All legacy records successfully linked with work ID using bulk operations!");
    process.exit(0);
  } catch (error) {
    console.error("Error running script:", error);
    process.exit(1);
  }
}

run();

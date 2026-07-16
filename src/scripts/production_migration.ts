import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import WorkDoneModel from '../schemas/workDone/workDone.schema';
import PaymentModel from '../schemas/payment/payment.schema';

// Load env
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const MONGO_URI = process.env.DATABASE || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dental";

const runProductionMigration = async () => {
  try {
    console.log("Connecting to MongoDB for full migration...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB successfully.");

    // STEP 1: MIGRATE DATA INTO PAYMENT COLLECTION
    console.log("\n--- STEP 1: Migrating Data ---");
    const workDones = await WorkDoneModel.find({ "paymentHistory.0": { $exists: true } });
    console.log(`Found ${workDones.length} WorkDone records with existing paymentHistory arrays.`);

    let totalPaymentsCreated = 0;
    
    for (const wd of workDones) {
      const history = (wd as any).paymentHistory || [];
      for (const p of history) {
        const newPayment = new PaymentModel({
          patient: wd.patient,
          workDone: wd._id,
          company: wd.company,
          amount: p.amount,
          date: p.date,
          paymentMethod: p.paymentMethod,
          receiptNumber: p.receiptNumber,
          note: p.note,
          createdBy: wd.createdBy
        });
        await newPayment.save();
        totalPaymentsCreated++;
      }
    }
    console.log(`Successfully migrated ${totalPaymentsCreated} payments into the new standalone Payment collection!`);

    // STEP 2: CLEANUP LEGACY ARRAYS
    console.log("\n--- STEP 2: Cleaning up legacy arrays ---");
    const workDoneResult = await mongoose.connection.db.collection("workdones").updateMany(
      {},
      { $unset: { paymentHistory: "" } }
    );
    console.log(`Successfully deleted legacy 'paymentHistory' field from ${workDoneResult.modifiedCount} WorkDone records.`);

    const accountabilityResult = await mongoose.connection.db.collection("accountabilities").updateMany(
      {},
      { $unset: { payoutHistory: "" } }
    );
    console.log(`Successfully deleted legacy 'payoutHistory' field from ${accountabilityResult.modifiedCount} Accountability records.`);

    console.log("\n✅ ENTIRE MIGRATION & CLEANUP FINISHED SUCCESSFULLY! ✅");
    process.exit(0);

  } catch (err) {
    console.error("Migration/Cleanup Error:", err);
    process.exit(1);
  }
};

runProductionMigration();

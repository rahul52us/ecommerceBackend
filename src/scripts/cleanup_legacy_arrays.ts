import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Load env
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const MONGO_URI = process.env.DATABASE || "mongodb://127.0.0.1:27017/dental";

const runCleanup = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB");

    // 1. Delete paymentHistory from WorkDone
    console.log("Removing paymentHistory from all WorkDone records...");
    const workDoneResult = await mongoose.connection.db.collection("workdones").updateMany(
      {},
      { $unset: { paymentHistory: "" } }
    );
    console.log(`Successfully removed paymentHistory from ${workDoneResult.modifiedCount} WorkDone records.`);

    // 2. Delete payoutHistory from Accountability
    console.log("Removing payoutHistory from all Accountability records...");
    const accountabilityResult = await mongoose.connection.db.collection("accountabilities").updateMany(
      {},
      { $unset: { payoutHistory: "" } }
    );
    console.log(`Successfully removed payoutHistory from ${accountabilityResult.modifiedCount} Accountability records.`);

    console.log("Cleanup Complete!");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup Error:", err);
    process.exit(1);
  }
};

runCleanup();

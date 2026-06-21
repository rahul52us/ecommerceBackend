import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function checkCounts() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/dental");
  
  const compCount = await mongoose.connection.db.collection("legacyworkcomps").countDocuments();
  const detailCount = await mongoose.connection.db.collection("legacyworkcompdetails").countDocuments();
  const tranCount = await mongoose.connection.db.collection("legacytransactions").countDocuments();
  const feeCount = await mongoose.connection.db.collection("legacyworkfees").countDocuments();
  const toothCount = await mongoose.connection.db.collection("legacytoothworks").countDocuments();

  console.log("--- MONGODB ACTUAL COUNTS ---");
  console.log("LegacyWorkComp:", compCount);
  console.log("LegacyWorkCompDetail:", detailCount);
  console.log("LegacyTransaction:", tranCount);
  console.log("LegacyWorkFee:", feeCount);
  console.log("LegacyToothWork:", toothCount);
  console.log("-----------------------------");

  process.exit(0);
}

checkCounts();

// import mongoose from "mongoose";
// import * as dotenv from "dotenv";
// dotenv.config();

// import LegacyWorkComp from "../schemas/legacy/LegacyWorkComp";
// import LegacyWorkCompDetail from "../schemas/legacy/LegacyWorkCompDetail";
// import LegacyToothWork from "../schemas/legacy/LegacyToothWork";
// import LegacyWorkFee from "../schemas/legacy/LegacyWorkFee";
// import LegacyTransaction from "../schemas/legacy/LegacyTransaction";

// const run = async () => {
//   await mongoose.connect(process.env.MONGODB_URI as string);
//   console.log("Connected to DB");

//   console.log("Wiping all 5 legacy collections...");
//   await LegacyWorkComp.deleteMany({});
//   await LegacyWorkCompDetail.deleteMany({});
//   await LegacyToothWork.deleteMany({});
//   await LegacyWorkFee.deleteMany({});
//   await LegacyTransaction.deleteMany({});

//   console.log("Checking counts to verify...");
//   const c1 = await LegacyWorkComp.countDocuments();
//   const c2 = await LegacyWorkCompDetail.countDocuments();
//   const c3 = await LegacyToothWork.countDocuments();
//   const c4 = await LegacyWorkFee.countDocuments();
//   const c5 = await LegacyTransaction.countDocuments();

//   console.log(`Counts -> WorkComp: ${c1}, Details: ${c2}, ToothWork: ${c3}, WorkFee: ${c4}, Transaction: ${c5}`);
//   console.log("Wipe completed successfully.");
//   process.exit(0);
// };

// run().catch(console.error);

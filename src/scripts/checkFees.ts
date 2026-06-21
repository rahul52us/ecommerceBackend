import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

import LegacyWorkFee from "../schemas/legacy/LegacyWorkFee";
import LegacyWorkComp from "../schemas/legacy/LegacyWorkComp";

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to DB");

  const comps = await LegacyWorkComp.find({ legacyPatCode: "27343502SUN" }).lean();
  console.log(`Found ${comps.length} WorkComp records for SUNDER`);

  for (const comp of comps) {
    if (new Date(comp.wrk_date).getFullYear() === 2006) {
      console.log(`Checking WorkComp: legacyWrkDoneId = ${comp.legacyWrkDoneId}, date = ${comp.wrk_date}`);
      const fees = await LegacyWorkFee.find({ legacyWrkDoneId: comp.legacyWrkDoneId }).lean();
      console.log(`Found ${fees.length} Fees for this WorkComp:`);
      fees.forEach(f => console.log(f));
    }
  }

  process.exit(0);
};

run().catch(console.error);

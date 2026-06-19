import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import UserModel from "../schemas/User/User";
import LegacyWorkComp from "../schemas/legacy/LegacyWorkComp";
import LegacyWorkCompDetail from "../schemas/legacy/LegacyWorkCompDetail";
import LegacyToothWork from "../schemas/legacy/LegacyToothWork";
import LegacyTransaction from "../schemas/legacy/LegacyTransaction";
import LegacyWorkFee from "../schemas/legacy/LegacyWorkFee";

const COMPANY_ID = new mongoose.Types.ObjectId("65f65a70fbe7ae65d05dac64");

async function addCompany() {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/dentalbackend";
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(uri);
    console.log("Connected to MongoDB Atlas.");

    console.log(`Updating Legacy Users with company ID ${COMPANY_ID}...`);
    const userResult = await UserModel.updateMany(
      { previousRecord: true },
      { $set: { company: COMPANY_ID } }
    );
    console.log(`Users updated: ${userResult.modifiedCount}`);

    console.log(`Updating LegacyWorkComp...`);
    const wcResult = await LegacyWorkComp.updateMany({}, { $set: { company: COMPANY_ID } });
    console.log(`LegacyWorkComp updated: ${wcResult.modifiedCount}`);

    console.log(`Updating LegacyWorkCompDetail...`);
    const wcdResult = await LegacyWorkCompDetail.updateMany({}, { $set: { company: COMPANY_ID } });
    console.log(`LegacyWorkCompDetail updated: ${wcdResult.modifiedCount}`);

    console.log(`Updating LegacyToothWork...`);
    const twResult = await LegacyToothWork.updateMany({}, { $set: { company: COMPANY_ID } });
    console.log(`LegacyToothWork updated: ${twResult.modifiedCount}`);

    console.log(`Updating LegacyTransaction...`);
    const tResult = await LegacyTransaction.updateMany({}, { $set: { company: COMPANY_ID } });
    console.log(`LegacyTransaction updated: ${tResult.modifiedCount}`);

    console.log(`Updating LegacyWorkFee...`);
    const wfResult = await LegacyWorkFee.updateMany({}, { $set: { company: COMPANY_ID } });
    console.log(`LegacyWorkFee updated: ${wfResult.modifiedCount}`);

    console.log("All legacy records successfully updated with company ID!");
    process.exit(0);
  } catch (error) {
    console.error("Error updating company:", error);
    process.exit(1);
  }
}

addCompany();

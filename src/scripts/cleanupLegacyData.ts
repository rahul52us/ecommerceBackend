import mongoose from "mongoose";
import UserModel from "../schemas/User/User";
import ProfileDetails from "../schemas/User/ProfileDetails";
import LegacyWorkComp from "../schemas/legacy/LegacyWorkComp";
import LegacyWorkCompDetail from "../schemas/legacy/LegacyWorkCompDetail";
import LegacyToothWork from "../schemas/legacy/LegacyToothWork";
import LegacyWorkFee from "../schemas/legacy/LegacyWorkFee";
import LegacyTransaction from "../schemas/legacy/LegacyTransaction";
import dotenv from "dotenv";

dotenv.config();

async function clean() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/dentalbackend");
  
  console.log("Cleaning legacy records from Atlas...");

  const usersToDelete = await UserModel.find({ previousRecord: true }).select("_id");
  const userIds = usersToDelete.map(u => u._id);

  await ProfileDetails.deleteMany({ user: { $in: userIds } });
  await UserModel.deleteMany({ previousRecord: true });

  await LegacyWorkComp.deleteMany({});
  await LegacyWorkCompDetail.deleteMany({});
  await LegacyToothWork.deleteMany({});
  await LegacyWorkFee.deleteMany({});
  await LegacyTransaction.deleteMany({});

  console.log("Cleanup complete!");
  process.exit(0);
}

clean();

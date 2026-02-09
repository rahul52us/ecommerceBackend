import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectToDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI as string;

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000, // 30 sec
    });

    console.log("✅ Connected to MongoDB Atlas");
  } catch (error: any) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1); // stop app if DB fails
  }
};

export default connectToDatabase;

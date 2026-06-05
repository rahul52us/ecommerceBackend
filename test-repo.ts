import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import LabWorkRepository from "./src/repository/labWork/labWork.repository";

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/dental");
        console.log("Connected to DB. Running query for 'naresh'...");
        const res = await LabWorkRepository.getAll({ search: "naresh" });
        console.log("Success! Count:", res.count);
    } catch(e) {
        console.error("ERROR OCCURRED:", e);
    }
    process.exit(0);
};
run();

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/dental");
        const LabWork = mongoose.model("LabWork", new mongoose.Schema({}, { strict: false }));
        const pipeline = [
            {
                $lookup: {
                    from: "users",
                    localField: "patient",
                    foreignField: "_id",
                    as: "patientData",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "primaryDoctor",
                    foreignField: "_id",
                    as: "doctorData",
                },
            },
            {
                $match: {
                    $or: [
                        { "patientData.name": new RegExp("ritu", "i") },
                        { "doctorData.name": new RegExp("ritu", "i") }
                    ]
                }
            }
        ];
        console.log("Running pipeline...");
        const res = await LabWork.aggregate(pipeline);
        console.log("Matched docs:", res.length);
        if(res.length > 0) {
            console.log("First match patientData name:", res[0].patientData[0]?.name);
            console.log("First match doctorData name:", res[0].doctorData[0]?.name);
        }
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
};
run();

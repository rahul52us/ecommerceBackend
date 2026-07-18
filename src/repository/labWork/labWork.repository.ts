import LabWork from "../../schemas/labWork/labWork.schema";
import mongoose from "mongoose";

class LabWorkRepository {
  async create(data: any) {
    const labWork = new LabWork(data);
    return await labWork.save();
  }

  async getAll(query: any = {}, options: any = {}) {
    const { search, fromDate, toDate, doctorName, noReceivedDate, noSendDate, ...filters } = query;
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    let mongoQuery: any = { ...filters, isActive: true };

    if (fromDate || toDate) {
      mongoQuery.createdAt = {};
      if (fromDate) mongoQuery.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        mongoQuery.createdAt.$lte = to;
      }
    }

    const orConditions = [];

    if (noReceivedDate === true || noReceivedDate === 'true') {
      orConditions.push({
        $or: [
          { receivedDate: { $exists: false } },
          { receivedDate: null },
          { receivedDate: "" },
        ]
      });
    }

    if (noSendDate === true || noSendDate === 'true') {
      orConditions.push({
        $or: [
          { sendDate: { $exists: false } },
          { sendDate: null },
          { sendDate: "" },
        ]
      });
    }

    if (orConditions.length > 0) {
      mongoQuery.$and = orConditions;
    }

    if (mongoQuery.patient && typeof mongoQuery.patient === "string") {
      mongoQuery.patient = new mongoose.Types.ObjectId(mongoQuery.patient);
    }
    if (mongoQuery.primaryDoctor && typeof mongoQuery.primaryDoctor === "string") {
      mongoQuery.primaryDoctor = new mongoose.Types.ObjectId(mongoQuery.primaryDoctor);
    }
    if (mongoQuery.lab && typeof mongoQuery.lab === "string") {
      mongoQuery.lab = new mongoose.Types.ObjectId(mongoQuery.lab);
    }
    if (mongoQuery.company && typeof mongoQuery.company === "string") {
      mongoQuery.company = new mongoose.Types.ObjectId(mongoQuery.company);
    }

    // Use aggregation to support searching by populated fields
    const pipeline: any[] = [
      { $match: mongoQuery },
      {
        $lookup: {
          from: "users",
          localField: "patient",
          foreignField: "_id",
          as: "patientData",
        },
      },
      { $unwind: { path: "$patientData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "primaryDoctor",
          foreignField: "_id",
          as: "doctorData",
        },
      },
      { $unwind: { path: "$doctorData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "labdoctors",
          localField: "primaryDoctor",
          foreignField: "_id",
          as: "labDoctorData",
        },
      },
      { $unwind: { path: "$labDoctorData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "labs",
          localField: "lab",
          foreignField: "_id",
          as: "labData",
        },
      },
      { $unwind: { path: "$labData", preserveNullAndEmptyArrays: true } },
    ];

    if (doctorName) {
      pipeline.push({
        $match: {
          $or: [
            { "doctorData.name": { $regex: doctorName, $options: "i" } },
            { "labDoctorData.labDoctorName": { $regex: doctorName, $options: "i" } },
            { doctorNameManual: { $regex: doctorName, $options: "i" } },
          ],
        },
      });
    }

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { labInstructions: { $regex: search, $options: "i" } },
            { labNameManual: { $regex: search, $options: "i" } },
            { patientNameManual: { $regex: search, $options: "i" } },
            { doctorNameManual: { $regex: search, $options: "i" } },
            { warrantyCardNumber: { $regex: search, $options: "i" } },
            { "selectedWorks.customNotes": { $regex: search, $options: "i" } },
            { "patientData.name": { $regex: search, $options: "i" } },
            { "patientData.mobileNumber": { $regex: search, $options: "i" } },
            { "patientData.code": { $regex: search, $options: "i" } },
            { "doctorData.name": { $regex: search, $options: "i" } },
            { "doctorData.mobileNumber": { $regex: search, $options: "i" } },
            { "doctorData.code": { $regex: search, $options: "i" } },
            { "labDoctorData.labDoctorName": { $regex: search, $options: "i" } },
            { "labDoctorData.mobileNumber": { $regex: search, $options: "i" } },
            { "labData.name": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await LabWork.aggregate(countPipeline);
    const totalCount = countResult.length > 0 ? countResult[0].total : 0;

    pipeline.push({ $sort: sort });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const data = await LabWork.aggregate(pipeline);

    // Populate the results to match the expected format (for model instances)
    const populatedData = await LabWork.populate(data, [
      { path: "patient", select: "name code mobileNumber pic" },
      { path: "primaryDoctor", select: "name labDoctorName code pic" },
      { path: "lab", select: "name" },
    ]);

    return { data: populatedData, count: totalCount, page, limit };
  }

  async getById(id: string) {
    return await LabWork.findOne({ _id: id, isActive: true })
      .populate("patient", "name code mobileNumber pic")
      .populate("primaryDoctor", "name labDoctorName code pic")
      .populate("lab", "name");
  }

  async update(id: string, data: any) {
    return await LabWork.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: data },
      { new: true }
    );
  }

  async delete(id: string) {
    return await LabWork.findOneAndUpdate(
      { _id: id },
      { $set: { isActive: false } },
      { new: true }
    );
  }
}

export default new LabWorkRepository();

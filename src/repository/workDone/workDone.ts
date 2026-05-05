import mongoose from "mongoose";
import WorkDoneSchema from "../../schemas/workDone/workDone.schema";

const toObjectId = (id: any) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(String(id));
  return null;
};

export const createWorkDone = async (data: any) => {
  try {
    const {
      patient, treatment, status, workDoneNote, amount, discount, doctor, 
      treatmentCode, complaintType, tooth, toothNotation, dentitionType, 
      position, side, toothNote, recordType, examiningDoctor, user, company,
    } = data;

    const newWorkDone = new WorkDoneSchema({
      patient, treatment, status, workDoneNote, amount, discount, doctor,
      treatmentCode, complaintType, tooth, toothNotation, dentitionType,
      position, side, toothNote, recordType, examiningDoctor, company,
      createdBy: user, updatedBy: user,
    });

    const saved = await newWorkDone.save();
    return { success: "success", message: "Work done created successfully.", data: saved, statusCode: 201 };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};

export const getWorkDone = async (query: any) => {
  try {
    const pageNum = Number(query.page) || 1;
    const limitNum = Number(query.limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    const { patientId, treatmentId, company, doctorId } = query;

    const companyId = toObjectId(company);
    const patId = toObjectId(patientId);
    const docId = toObjectId(doctorId);

    // Build Match Stage
    const matchStage: any = {
      isActive: { $ne: false }
    };

    if (companyId) {
      matchStage.company = companyId;
    }
    if (patId) {
      matchStage.patient = patId;
    }
    if (docId && doctorId !== 'all') {
      matchStage.doctor = docId;
    }
    if (treatmentId && mongoose.Types.ObjectId.isValid(treatmentId)) {
      matchStage.treatment = new mongoose.Types.ObjectId(String(treatmentId));
    }

    const pipeline: any[] = [
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: "users",
          localField: "patient",
          foreignField: "_id",
          as: "patientDetails",
        },
      },
      { $unwind: { path: "$patientDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "doctor",
          foreignField: "_id",
          as: "doctorDetails",
        },
      },
      { $unwind: { path: "$doctorDetails", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          patient: "$patientDetails",
          doctor: "$doctorDetails"
        }
      }
    ];

    const data = await WorkDoneSchema.aggregate(pipeline);
    const totalItems = await WorkDoneSchema.countDocuments(matchStage);

    return {
      success: "success",
      message: `Found ${data.length} records for Company: ${company}`,
      data,
      totalItems,
      statusCode: 200,
    };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};

export const updateWorkDone = async (data: any) => {
  try {
    const {
      id, status, workDoneNote, amount, discount, doctor, treatmentCode, complaintType, 
      tooth, toothNotation, dentitionType, position, side, toothNote, recordType, examiningDoctor,
      receivedAmount, paymentAmount, paymentMethod, user 
    } = data;

    const updateQuery: any = {
      $set: {
        status, workDoneNote, amount, discount, doctor, treatmentCode, complaintType, 
        tooth, toothNotation, dentitionType, position, side, toothNote, recordType, 
        examiningDoctor, updatedBy: user,
      }
    };

    if (paymentAmount) {
      updateQuery.$push = { paymentHistory: { amount: paymentAmount, date: new Date(), paymentMethod } };
      updateQuery.$inc = { receivedAmount: paymentAmount };
    } else if (receivedAmount !== undefined) {
      updateQuery.$set.receivedAmount = receivedAmount;
    }

    const updated = await WorkDoneSchema.findByIdAndUpdate(id, updateQuery, { new: true });
    return { success: "success", message: "Work done updated successfully.", data: updated, statusCode: 200 };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};

export const deleteWorkDone = async (data: any) => {
  try {
    const { workDoneId, user } = data;
    await WorkDoneSchema.findByIdAndUpdate(workDoneId, { isActive: false, updatedBy: user });
    return { success: "success", message: "Work done deleted successfully.", statusCode: 200 };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};

export const getPatientFinancialStats = async (query: any) => {
  try {
    const { patientId, company, doctorId } = query;
    const companyId = toObjectId(company);
    const patId = toObjectId(patientId);
    const docId = toObjectId(doctorId);

    const matchStage: any = {
      isActive: { $ne: false },
    };

    if (patId) matchStage.patient = patId;
    if (companyId) matchStage.company = companyId;
    if (docId && doctorId !== 'all') matchStage.doctor = docId;

    const stats = await WorkDoneSchema.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalBill: { $sum: { $subtract: ["$amount", { $ifNull: ["$discount", 0] }] } },
          totalReceived: { $sum: { $ifNull: ["$receivedAmount", 0] } },
        },
      },
    ]);

    const result = stats[0] || { totalBill: 0, totalReceived: 0 };
    return {
      success: "success",
      data: {
        totalBill: result.totalBill,
        patientPending: Math.max(0, result.totalBill - result.totalReceived),
      },
      statusCode: 200,
    };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};

export const getPatientDoctors = async (patientId: string) => {
  try {
    const patId = toObjectId(patientId);
    if (!patId) return { success: "success", data: [], statusCode: 200 };

    const doctors = await WorkDoneSchema.aggregate([
      { $match: { patient: patId, isActive: { $ne: false } } },
      { $group: { _id: "$doctor" } },
      {
        $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "doctorDetails" }
      },
      { $unwind: "$doctorDetails" },
      {
        $project: { _id: "$doctorDetails._id", name: "$doctorDetails.name" }
      }
    ]);
    return { success: "success", data: doctors, statusCode: 200 };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};

export const getDoctorFinancialStats = async (query: any) => {
  try {
    const { doctorId, company } = query;
    const docId = toObjectId(doctorId);
    const compId = toObjectId(company);

    if (!docId || !compId) {
      return { success: "error", message: "Doctor and Company ID required", statusCode: 400 };
    }

    const matchStage: any = {
      doctor: docId,
      company: compId,
      isActive: { $ne: false },
    };

    const stats = await WorkDoneSchema.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalBill: { $sum: { $subtract: ["$amount", { $ifNull: ["$discount", 0] }] } },
          totalReceived: { $sum: { $ifNull: ["$receivedAmount", 0] } },
        },
      },
    ]);

    const result = stats[0] || { totalBill: 0, totalReceived: 0 };
    return {
      success: "success",
      data: {
        totalBill: result.totalBill,
        collected: result.totalReceived,
        pending: Math.max(0, result.totalBill - result.totalReceived),
      },
      statusCode: 200,
    };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};
export const getOverallPatientStats = async (query: any) => {
  try {
    const { patientId, company } = query;
    const companyId = toObjectId(company);
    const patId = toObjectId(patientId);

    const matchStage: any = {
      isActive: { $ne: false },
      patient: patId,
      company: companyId,
    };

    const stats = await WorkDoneSchema.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalBill: { $sum: { $subtract: ["$amount", { $ifNull: ["$discount", 0] }] } },
          totalReceived: { $sum: { $ifNull: ["$receivedAmount", 0] } },
        },
      },
    ]);

    const result = stats[0] || { totalBill: 0, totalReceived: 0 };
    return {
      success: "success",
      data: {
        totalBill: result.totalBill,
        patientPending: Math.max(0, result.totalBill - result.totalReceived),
      },
      statusCode: 200,
    };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};

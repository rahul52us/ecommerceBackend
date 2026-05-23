import mongoose from "mongoose";
import WorkDoneSchema from "../../schemas/workDone/workDone.schema";
import UserModel from "../../schemas/User/User";
import CompanyModel from "../../schemas/company/Company";
import AccountabilityModel from "../../schemas/accountability/accountability.schema";

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

    if (query.fromDate || query.toDate) {
      matchStage.createdAt = {};
      if (query.fromDate) matchStage.createdAt.$gte = new Date(query.fromDate);
      if (query.toDate) matchStage.createdAt.$lte = new Date(query.toDate);
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
        $lookup: {
          from: "users",
          localField: "examiningDoctor",
          foreignField: "_id",
          as: "examiningDoctorDetails",
        },
      },
      { $unwind: { path: "$examiningDoctorDetails", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          patient: "$patientDetails",
          doctor: "$doctorDetails",
          examiningDoctor: "$examiningDoctorDetails"
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
    
    // Cascade delete any corresponding accountability record linked to this work done entry
    await AccountabilityModel.deleteMany({ workDone: workDoneId });

    return { success: "success", message: "Work done deleted successfully.", statusCode: 200 };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};

export const getPatientStatementData = async (query: any) => {
  try {
    const { patientId, company, doctorId, status, startDate, endDate } = query;
    const pId = toObjectId(patientId);
    const cId = toObjectId(company);

    if (!pId || !cId) {
      return { success: "error", message: "Patient and Company ID required", statusCode: 400 };
    }

    const patient = await UserModel.findById(pId).select("name mobileNumber code profile_details");
    const clinic = await CompanyModel.findById(cId);

    const findQuery: any = {
      patient: pId,
      company: cId,
      isActive: { $ne: false }
    };

    if (doctorId && doctorId !== "all") {
      findQuery.doctor = toObjectId(doctorId);
    }

    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day

      findQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: end
      };
    }

    const records = await WorkDoneSchema.find(findQuery)
      .sort({ createdAt: 1 })
      .populate("doctor", "name")
      .populate("examiningDoctor", "name");

    let filteredRecords = records;
    if (status && status !== "all") {
      if (status === "SETTLED") {
        filteredRecords = records.filter(r => (r.receivedAmount || 0) >= (r.amount - (r.discount || 0)));
      } else if (status === "PENDING") {
        filteredRecords = records.filter(r => (r.receivedAmount || 0) < (r.amount - (r.discount || 0)));
      }
    }

    return {
      success: "success",
      data: {
        patient,
        clinic,
        records: filteredRecords
      },
      statusCode: 200
    };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};

/**
 * FETCH DATA FOR A SINGLE WORKDONE RECORD RECEIPT
 * Separated from main statement logic to avoid disturbance.
 */
export const getSingleWorkDoneStatementData = async (query: any) => {
  try {
    const { workDoneId, company } = query;
    const wId = toObjectId(workDoneId);
    const cId = toObjectId(company);

    if (!wId || !cId) {
      return { success: "error", message: "WorkDone and Company ID required", statusCode: 400 };
    }

    const clinic = await CompanyModel.findById(cId);
    const record = await WorkDoneSchema.findOne({ _id: wId, company: cId, isActive: { $ne: false } })
      .populate("patient", "name mobileNumber code profile_details")
      .populate("doctor", "name")
      .populate("examiningDoctor", "name")
      .populate("treatment", "treatmentPlan");

    if (!record) {
      return { success: "error", message: "Record not found", statusCode: 404 };
    }

    return {
      success: "success",
      data: {
        patient: record.patient,
        clinic,
        records: [record]
      },
      statusCode: 200
    };
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

/**
 * FETCH DATA FOR DOCTOR-SPECIFIC WORK DONE REPORT
 */
export const getDoctorWorkDoneReportData = async (query: any) => {
  try {
    const { doctorId, patientId, company, fromDate, toDate, status } = query;
    const docId = toObjectId(doctorId);
    const patId = toObjectId(patientId);
    const compId = toObjectId(company);

    if (!docId || !compId) {
      return { success: "error", message: "Doctor and Company ID required", statusCode: 400 };
    }

    const matchStage: any = {
      doctor: docId,
      company: compId,
      isActive: { $ne: false }
    };

    if (patId) {
      matchStage.patient = patId;
    }

    if (fromDate || toDate) {
      matchStage.createdAt = {};
      if (fromDate) matchStage.createdAt.$gte = new Date(fromDate);
      if (toDate) matchStage.createdAt.$lte = new Date(toDate);
    }

    // Use Aggregation to handle the 'status' (Settled/Pending) filter
    const pipeline: any[] = [
      { $match: matchStage },
      {
        $addFields: {
          isSettled: {
            $gte: [{ $ifNull: ["$receivedAmount", 0] }, { $subtract: ["$amount", { $ifNull: ["$discount", 0] }] }]
          }
        }
      }
    ];

    if (status === "SETTLED") {
      pipeline.push({ $match: { isSettled: true } });
    } else if (status === "PENDING") {
      pipeline.push({ $match: { isSettled: false } });
    }

    pipeline.push(
      { $sort: { createdAt: -1 } },
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
          from: "toothtreatments",
          localField: "treatment",
          foreignField: "_id",
          as: "treatmentData",
        },
      },
      { $unwind: { path: "$treatmentData", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          amount: 1,
          discount: 1,
          receivedAmount: 1,
          createdAt: 1,
          workDoneNote: 1,
          tooth: 1,
          patient: {
            name: "$patientData.name",
            mobileNumber: "$patientData.mobileNumber",
            code: "$patientData.code"
          },
          treatment: {
            treatmentPlan: "$treatmentData.treatmentPlan",
            notes: "$treatmentData.notes"
          }
        }
      }
    );

    const records = await WorkDoneSchema.aggregate(pipeline);

    if (!records || records.length === 0) {
      return { success: "error", message: "No records found for the selected filters", statusCode: 404 };
    }

    const doctor = await UserModel.findById(docId).select("name");
    const clinic = await CompanyModel.findById(compId);

    return {
      success: "success",
      data: {
        doctor,
        clinic,
        records
      },
      statusCode: 200
    };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};

/**
 * FETCH DATA FOR AN INDIVIDUAL PAYMENT RECEIPT
 */
export const getPaymentReceiptData = async (query: any) => {
  try {
    const { workDoneId, paymentIndex, company } = query;
    const wId = toObjectId(workDoneId);
    const cId = toObjectId(company);
    const index = Number(paymentIndex);

    if (!wId || !cId) {
      return { success: "error", message: "IDs required", statusCode: 400 };
    }

    const clinic = await CompanyModel.findById(cId);
    const record = await WorkDoneSchema.findOne({ _id: wId, company: cId, isActive: { $ne: false } })
      .populate("patient", "name mobileNumber code profile_details")
      .populate("doctor", "name")
      .populate("treatment", "treatmentPlan");

    if (!record) {
      return { success: "error", message: "Record not found", statusCode: 404 };
    }

    const paymentEntry = record.paymentHistory[index];
    if (!paymentEntry) {
      return { success: "error", message: "Payment entry not found", statusCode: 404 };
    }

    return {
      success: "success",
      data: {
        patient: record.patient,
        clinic,
        record: {
          treatmentName: (record.treatment as any)?.treatmentPlan || record.workDoneNote || "General Procedure",
          tooth: record.tooth || "N/A",
          doctorName: (record.doctor as any)?.name || "N/A",
          _id: record._id
        },
        payment: paymentEntry
      },
      statusCode: 200
    };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};

/**
 * FETCH ALL WORK DONE RECORDS FOR A SPECIFIC PATIENT ON A SPECIFIC DATE
 */
export const getDailyWorkDoneData = async (params: { patientId: string, date: string, company: string }) => {
  try {
    const { patientId, date, company } = params;

    // Calculate Start and End of the selected date
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const records = await WorkDoneSchema.find({
      patient: patientId,
      company: company,
      createdAt: { $gte: startDate, $lte: endDate },
      isActive: { $ne: false }
    })
      .populate("doctor", "name")
      .populate("examiningDoctor", "name")
      .populate({
        path: "patient",
        select: "name mobileNumber code profile_details",
        populate: {
          path: "profile_details",
          model: "ProfileDetails"
        }
      })
      .sort({ createdAt: 1 });

    if (!records || records.length === 0) {
      return {
        statusCode: 404,
        success: "error",
        message: "No records found for the selected date.",
      };
    }

    return {
      statusCode: 200,
      success: "success",
      message: "Records fetched successfully",
      data: records,
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      success: "error",
      message: err?.message,
    };
  }
};

/**
 * GROUP AND COUNT WORK DONE RECORDS BY DATE
 */
export const getWorkDoneCountByDate = async (query: any) => {
  try {
    const { patientId, company } = query;

    if (!patientId || !company) {
      return {
        success: "error",
        message: "Patient ID and Company ID are required.",
        statusCode: 400,
      };
    }

    if (!mongoose.Types.ObjectId.isValid(patientId) || !mongoose.Types.ObjectId.isValid(company)) {
      return {
        success: "error",
        message: "Invalid Patient ID or Company ID format.",
        statusCode: 400,
      };
    }

    const matchStage = {
      isActive: { $ne: false },
      patient: new mongoose.Types.ObjectId(patientId),
      company: new mongoose.Types.ObjectId(company),
    };

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } as any },
      {
        $project: {
          date: "$_id",
          count: 1,
          _id: 0
        }
      }
    ];

    const result = await WorkDoneSchema.aggregate(pipeline);

    return {
      success: "success",
      data: result,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      success: "error",
      message: "Server error while aggregating work done counts.",
      error: error.message,
      statusCode: 500,
    };
  }
};


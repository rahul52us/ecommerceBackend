import mongoose from "mongoose";
import WorkDoneSchema from "../../schemas/workDone/workDone.schema";
import UserModel from "../../schemas/User/User";
import CompanyModel from "../../schemas/company/Company";
import AccountabilityModel from "../../schemas/accountability/accountability.schema";
import { createReceipt } from "../receipt/receipt.repository";

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
    const { patientId, treatmentId, company, doctorId, toothNumber } = query;

    const companyId = toObjectId(company);
    const patId = toObjectId(patientId);

    // Build Match Stage
    const matchStage: any = {
      isActive: { $ne: false }
    };

    if (companyId) {
      matchStage.company = companyId;
    }
    if (patientId && patientId !== 'undefined' && patId) {
      matchStage.patient = patId;
    }

    if (doctorId && doctorId !== 'all' && doctorId !== 'undefined') {
      const docIds = String(doctorId).split(',').map((id: string) => toObjectId(id.trim())).filter(Boolean);
      if (docIds.length > 0) {
        matchStage.doctor = { $in: docIds };
      }
    }

    if (toothNumber && toothNumber !== 'all' && toothNumber !== 'undefined') {
      const teeth = String(toothNumber).split(',').map(t => t.trim()).filter(Boolean);
      if (teeth.length > 0) {
        matchStage.tooth = { $in: teeth };
      }
    }

    if (treatmentId && mongoose.Types.ObjectId.isValid(treatmentId)) {
      matchStage.treatment = new mongoose.Types.ObjectId(String(treatmentId));
    }

    if (query.fromDate || query.toDate) {
      matchStage.createdAt = {};
      if (query.fromDate) {
        const start = new Date(query.fromDate);
        start.setHours(0, 0, 0, 0);
        matchStage.createdAt.$gte = start;
      }
      if (query.toDate) {
        const end = new Date(query.toDate);
        end.setHours(23, 59, 59, 999);
        matchStage.createdAt.$lte = end;
      }
    }

    if (query.status && query.status !== "all" && query.status !== "undefined") {
      matchStage.status = query.status.toLowerCase();
    }

    if (query.search) {
      matchStage.$or = [
        { tooth: { $regex: query.search, $options: "i" } },
        { treatmentCode: { $regex: query.search, $options: "i" } },
        { workDoneNote: { $regex: query.search, $options: "i" } }
      ];
    }

    if (query.sittingNo && query.sittingNo !== 'undefined') {
      const sittings = String(query.sittingNo).split(',').map(s => Number(s.trim())).filter(s => !isNaN(s));
      if (sittings.length > 0) {
        matchStage.sittingNo = { $in: sittings };
        matchStage.status = { $in: [/^pending$/i, /^incomplete$/i] };
      }
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
      },
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "workDone",
          as: "paymentHistory"
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
      receivedAmount, user
    } = data;

    const currentRecord: any = await WorkDoneSchema.findById(id);
    if (!currentRecord) {
      throw new Error("Work done record not found.");
    }

    const currentBill = (amount !== undefined ? amount : currentRecord.amount || 0) - (discount !== undefined ? discount : currentRecord.discount || 0);
    const proposedReceived = receivedAmount !== undefined ? receivedAmount : currentRecord.receivedAmount || 0;

    // if (proposedReceived > currentBill) {
    //   throw new Error(`Total payments (Rs. ${proposedReceived}) cannot exceed total bill (Rs. ${currentBill}).`);
    // }

    const updateQuery: any = {
      $set: {
        status, workDoneNote, amount, discount, doctor, treatmentCode, complaintType,
        tooth, toothNotation, dentitionType, position, side, toothNote, recordType,
        examiningDoctor, updatedBy: user,
      }
    };

    if (receivedAmount !== undefined) {
      updateQuery.$set.receivedAmount = receivedAmount;
      updateQuery.$set.updateLastAccountbilityDate = new Date();
    }

    const updated = await WorkDoneSchema.findByIdAndUpdate(id, updateQuery, { new: true });

    if (updated) {
      const bill = (updated.amount || 0) - (updated.discount || 0);
      const alreadyPaid = updated.receivedAmount || 0;
      const statusStr = alreadyPaid >= bill ? "PAID" : "PENDING";
      let accountability: any = await AccountabilityModel.findOne({ workDone: id });

      if (accountability) {
        accountability.totalAmount = bill;
        accountability.doctor = updated.doctor;
        accountability.patient = updated.patient;
        accountability.tooth = updated.tooth;
        accountability.treatmentName = updated.treatmentCode || updated.workDoneNote || "General Procedure";
        accountability.payoutStatus = statusStr;
        if (receivedAmount !== undefined) {
           accountability.doctorShareAmount = receivedAmount;
           accountability.lastAccountabilityAmountUpdated = new Date();
        }
        await accountability.save();
      } else if (receivedAmount !== undefined && receivedAmount > 0) {
        const newAcc = new AccountabilityModel({
          workDone: id,
          doctor: updated.doctor,
          patient: updated.patient,
          company: updated.company,
          tooth: updated.tooth,
          treatmentName: updated.treatmentCode || updated.workDoneNote || "General Procedure",
          totalAmount: bill,
          doctorShareAmount: receivedAmount,
          payoutStatus: statusStr,
          lastAccountabilityAmountUpdated: new Date(),
          createdBy: user
        });
        await newAcc.save();
      }
    }

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

export const updateWorkDoneAmount = async (data: any) => {
  try {
    const { id, amount, user } = data;

    const workDone: any = await WorkDoneSchema.findById(id);
    if (!workDone) {
      return { success: "error", message: "Work done record not found.", statusCode: 404 };
    }

    const newBill = amount - (workDone.discount || 0);
    const alreadyPaid = workDone.receivedAmount || 0;

    if (newBill < alreadyPaid) {
      return { success: "error", message: `New bill amount (Rs. ${newBill}) cannot be less than already received amount (Rs. ${alreadyPaid}).`, statusCode: 400 };
    }

    // Update WorkDone amount
    workDone.amount = amount;
    workDone.updatedBy = user;
    const updatedWorkDone = await workDone.save();

    // Also update accountability totalAmount if it exists
    const accountability = await AccountabilityModel.findOne({ workDone: id });
    if (accountability) {
      accountability.totalAmount = amount - (workDone.discount || 0); // Assuming total amount is bill amount (amount - discount)
      await accountability.save();
    }

    return { success: "success", message: "Work done amount updated successfully.", data: updatedWorkDone, statusCode: 200 };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};

export const assignWorkDoneSittingNo = async (data: any) => {
  try {
    const { workDoneId, sittingNo, user } = data;

    if (!workDoneId || sittingNo === undefined) {
      return {
        success: "error",
        message: "WorkDone ID and Sitting No are required.",
        statusCode: 400,
      };
    }

    const record: any = await WorkDoneSchema.findById(workDoneId);

    if (!record) {
      return {
        success: "error",
        message: "Work done record not found.",
        statusCode: 404,
      };
    }

    record.sittingNo = Number(sittingNo);
    if (record.status && record.status !== record.status.toLowerCase()) {
      record.status = record.status.toLowerCase();
    }
    record.updatedAt = new Date();
    record.updatedBy = user;

    const saved = await record.save();

    return {
      success: "success",
      message: "Sitting number assigned successfully.",
      data: saved,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      success: "error",
      message: error.message,
      statusCode: 500,
    };
  }
};

export const getPatientStatementData = async (query: any) => {
  try {
    const { patientId, company, doctorId, status, startDate, endDate, toothNumber } = query;
    const pId = toObjectId(patientId);
    const cId = toObjectId(company);

    if (!pId || !cId) {
      return { success: "error", message: "Patient and Company ID required", statusCode: 400 };
    }

    const patient = await UserModel.findById(pId).select("name mobileNumber code profile_details").populate({ path: "profile_details", model: "ProfileDetails" });
    const clinic = await CompanyModel.findById(cId);

    const findQuery: any = {
      patient: pId,
      company: cId,
      isActive: { $ne: false }
    };

    if (toothNumber && toothNumber !== 'all' && toothNumber !== 'undefined') {
      const teeth = String(toothNumber).split(',').map(t => t.trim()).filter(Boolean);
      if (teeth.length > 0) {
        findQuery.tooth = { $in: teeth };
      }
    }

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
      .sort({ createdAt: -1 })
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
      .populate({
        path: "patient",
        select: "name mobileNumber code profile_details",
        populate: {
          path: "profile_details",
          model: "ProfileDetails"
        }
      })
      .populate("doctor", "name")
      .populate("examiningDoctor", "name")
      .populate("treatment", "treatmentPlan")
      .populate("paymentHistory");

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

/**
 * FETCH FILTERED TABLE DATA FOR PDF
 */
export const getFilteredTablePDFData = async (query: any) => {
  try {
    const { patientId, company } = query;
    const cId = toObjectId(company);

    if (!cId) {
      return { success: "error", message: "Company ID required", statusCode: 400 };
    }

    // Reuse getWorkDone to fetch the exact table data without limit
    const result = await getWorkDone({
      ...query,
      limit: 10000,
      page: 1
    });

    if (result.success === "error") return result;

    const records = result.data || [];
    records.sort((a: any, b: any) => {
      const sA = a.sittingNo ? Number(a.sittingNo) : Infinity;
      const sB = b.sittingNo ? Number(b.sittingNo) : Infinity;
      if (sA !== sB) return sA - sB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    let patientObj = records.length > 0 ? records[0].patient : null;

    if (!patientObj && patientId) {
      patientObj = await UserModel.findById(patientId).select("name mobileNumber code profile_details").populate({
        path: "profile_details",
        model: "ProfileDetails"
      });
    }

    const clinic = await CompanyModel.findById(cId);

    return {
      success: "success",
      data: {
        patient: patientObj,
        clinic,
        records
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

    if (query.sittingNo && query.sittingNo !== 'undefined') {
      const sittings = String(query.sittingNo).split(',').map(s => Number(s.trim())).filter(s => !isNaN(s));
      if (sittings.length > 0) {
        matchStage.sittingNo = { $in: sittings };
        matchStage.status = { $in: [/^pending$/i, /^incomplete$/i] };
      }
    }

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
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        matchStage.createdAt.$gte = start;
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        matchStage.createdAt.$lte = end;
      }
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
export const getPaymentReceiptData = async (params: { wId: string, paymentId: string }, query: any) => {
  try {
    const { wId, paymentId } = params;
    const { company } = query;
    const cId = toObjectId(company);

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

    const PaymentModel = require("../../schemas/payment/payment.schema").default;
    const paymentEntry = await PaymentModel.findById(paymentId);
    if (!paymentEntry || String(paymentEntry.workDone) !== String(record._id)) {
      return { success: "error", message: "Payment entry not found for this record", statusCode: 404 };
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

/**
 * FETCH RECEIPTS LOG DATA FOR PDF
 */
export const getReceiptsLogData = async (query: any) => {
  try {
    const { patientId, company, startDate, endDate, doctorId } = query;
    const patId = toObjectId(patientId);
    const compId = toObjectId(company);

    if (!patId || !compId) {
      return { success: "error", message: "Patient and Company ID required", statusCode: 400 };
    }

    const matchStage: any = {
      patient: patId,
      company: compId,
      isActive: { $ne: false },
    };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchStage.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchStage.createdAt.$lte = end;
      }
    }

    // Since receipt numbers are strictly tracked here, query the ReceiptModel.
    const ReceiptModel = require("../../schemas/receipt/receipt.schema").default;

    // We populate workDone to filter by doctor if needed and to get doctor name
    const receipts = await ReceiptModel.find(matchStage)
      .populate("patient")
      .populate({
        path: "workDone",
        populate: [
          { path: "doctor" },
          { path: "paymentHistory" }
        ]
      })
      .populate("company")
      .populate("accountability")
      .sort({ createdAt: -1 });

    let filteredReceipts = receipts;
    if (doctorId && doctorId !== "all") {
      filteredReceipts = receipts.filter((r: any) =>
        r.workDone && r.workDone.doctor && String(r.workDone.doctor._id) === String(doctorId)
      );
    }

    let patientObj = filteredReceipts.length > 0 ? filteredReceipts[0].patient : null;
    if (!patientObj && patientId) {
      patientObj = await UserModel.findById(patientId).select("name mobileNumber code profile_details").populate({
        path: "profile_details",
        model: "ProfileDetails"
      });
    }

    const clinic = await CompanyModel.findById(compId);

    return {
      success: "success",
      data: {
        patient: patientObj,
        clinic,
        records: filteredReceipts
      },
      statusCode: 200
    };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};

export const getGlobalAccountabilityData = async (payload: any) => {
  try {
    const {
      company,
      patientIds,
      doctorIds,
      fromDate,
      toDate,
      status,
      tooth,
      page = 1,
      limit = 50,
    } = payload;

    const compId = toObjectId(company);
    const skip = (Number(page) - 1) * Number(limit);

    const matchStage: any = {
      isActive: { $ne: false },
    };

    if (compId) {
      matchStage.company = compId;
    }

    // Multiple patients
    if (Array.isArray(patientIds) && patientIds.length > 0) {
      const pIds = patientIds.map((id: string) => toObjectId(id)).filter(Boolean);
      if (pIds.length > 0) matchStage.patient = { $in: pIds };
    }

    // Multiple doctors
    if (Array.isArray(doctorIds) && doctorIds.length > 0) {
      const dIds = doctorIds.map((id: string) => toObjectId(id)).filter(Boolean);
      if (dIds.length > 0) matchStage.doctor = { $in: dIds };
    }

    let start: Date | null = null;
    let end: Date | null = null;

    // Date range
    if (fromDate || toDate) {
      if (fromDate) {
        start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
      }
      if (toDate) {
        end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
      }

      if (start && end) {
        const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 40) {
          throw new Error("Date range cannot exceed 40 days for the best performance.");
        }
      }

      const PaymentModel = require("../../schemas/payment/payment.schema").default;
      const paymentMatch: any = {};
      if (start && end) paymentMatch.date = { $gte: start, $lte: end };
      else if (start) paymentMatch.date = { $gte: start };
      else if (end) paymentMatch.date = { $lte: end };

      if (compId) paymentMatch.company = compId;

      const paymentsInPeriod = await PaymentModel.find(paymentMatch).select('workDone');
      const workDoneIdsWithPayments = paymentsInPeriod.map((p: any) => p.workDone);

      matchStage.$or = [
        {
          createdAt: {
            ...(start ? { $gte: start } : {}),
            ...(end ? { $lte: end } : {})
          }
        },
        { _id: { $in: workDoneIdsWithPayments } }
      ];
    }

    const paymentDateConditions: any = {};
    if (start) paymentDateConditions.$gte = start;
    if (end) paymentDateConditions.$lte = end;

    // Tooth filter
    if (tooth) {
      matchStage.tooth = { $regex: tooth, $options: "i" };
    }

    // Status filter is applied after balanceDue calculation

    // Payment Mode filter is now harder to do at matchStage for WorkDone directly without lookup.
    // But since we just need to filter WorkDone records that have a payment with this mode, we can do it via paymentsInPeriod earlier.
    if (payload.paymentMode && payload.paymentMode !== "all" && payload.paymentMode !== "undefined") {
      // Handled in the paymentMatch earlier if we refactor that. Let's do it:
    }

    if (payload.treatmentCode && payload.treatmentCode.trim() !== "") {
      const escapedTreatmentCode = payload.treatmentCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      matchStage["treatmentCode"] = { $regex: new RegExp(escapedTreatmentCode, "i") };
    }

    const pipeline: any[] = [
      { $match: matchStage },
      { $sort: { updateLastAccountbilityDate: -1, createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "patient",
          foreignField: "_id",
          as: "patientInfo",
          pipeline: [{ $project: { name: 1, code: 1, mobileNumber: 1, title: 1 } }],
        },
      },
      { $unwind: { path: "$patientInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "doctor",
          foreignField: "_id",
          as: "doctorInfo",
          pipeline: [{ $project: { name: 1, code: 1, title: 1 } }],
        },
      },
      { $unwind: { path: "$doctorInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "treatments",
          localField: "treatment",
          foreignField: "_id",
          as: "treatmentInfo",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      { $unwind: { path: "$treatmentInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "payments",
          let: { workDoneId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$workDone", "$$workDoneId"] },
                ...(Object.keys(paymentDateConditions).length > 0 ? { date: paymentDateConditions } : {})
              }
            }
          ],
          as: "paymentHistory"
        }
      },
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "workDone",
          as: "fullPaymentHistory"
        }
      },
      {
        $addFields: {
          periodReceivedAmount: { $sum: "$paymentHistory.amount" }
        }
      },
      {
        $addFields: {
          totalPaid: "$periodReceivedAmount",
          balanceDue: {
            $subtract: [
              { $subtract: [{ $ifNull: ["$amount", 0] }, { $ifNull: ["$discount", 0] }] },
              { $ifNull: ["$receivedAmount", 0] }
            ]
          }
        }
      },
      ...(status && status !== "all" ? [{
        $match: {
          balanceDue: status.toLowerCase() === "due" ? { $gt: 0 } : status.toLowerCase() === "overpaid" ? { $lt: 0 } : { $eq: 0 }
        }
      }] : []),
      { $unwind: { path: "$paymentHistory", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          // Total paid for this row is exactly the payment amount, or 0 if unpaid
          totalPaid: { $ifNull: ["$paymentHistory.amount", 0] },
          // Create unique row ID for React key rendering
          uniqueRowId: { $concat: [{ $toString: "$_id" }, "_", { $ifNull: [{ $toString: "$paymentHistory._id" }, "no-pay"] }] }
        }
      },
      {
        $project: {
          _id: 1,
          uniqueRowId: 1,
          createdAt: 1,
          updateLastAccountbilityDate: 1,
          tooth: 1,
          status: 1,
          amount: 1,
          discount: 1,
          workDoneNote: 1,
          treatmentCode: 1,
          totalPaid: 1,
          balanceDue: 1,
          paymentHistory: 1,
          fullPaymentHistory: 1,
          "patientInfo.name": 1,
          "patientInfo.code": 1,
          "patientInfo.mobileNumber": 1,
          "patientInfo.title": 1,
          "patientInfo._id": 1,
          "doctorInfo.name": 1,
          "doctorInfo._id": 1,
          "treatmentInfo.name": 1,
        }
      }
    ];

    // Get total count
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await WorkDoneSchema.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: Number(limit) });

    const records = await WorkDoneSchema.aggregate(pipeline);

    // Summary totals across ALL matching records (not just this page)
    const summaryPipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: "payments",
          let: { workDoneId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$workDone", "$$workDoneId"] },
                ...(Object.keys(paymentDateConditions).length > 0 ? { date: paymentDateConditions } : {})
              }
            }
          ],
          as: "paymentHistory"
        }
      },
      {
        $addFields: {
          periodReceivedAmount: { $sum: "$paymentHistory.amount" },
          balanceDue: {
            $subtract: [
              { $subtract: [{ $ifNull: ["$amount", 0] }, { $ifNull: ["$discount", 0] }] },
              { $ifNull: ["$receivedAmount", 0] }
            ]
          }
        }
      },
      ...(status && status !== "all" ? [{
        $match: {
          balanceDue: status.toLowerCase() === "due" ? { $gt: 0 } : status.toLowerCase() === "overpaid" ? { $lt: 0 } : { $eq: 0 }
        }
      }] : []),
      {
        $group: {
          _id: null,
          totalBilled: { $sum: { $subtract: [{ $ifNull: ["$amount", 0] }, { $ifNull: ["$discount", 0] }] } },
          totalPaid: { $sum: { $ifNull: ["$periodReceivedAmount", 0] } },
          totalDue: { $sum: "$balanceDue" }
        },
      }
    ];

    const summaryResult = await WorkDoneSchema.aggregate(summaryPipeline);
    const summary = summaryResult[0] || { totalBilled: 0, totalPaid: 0, totalDue: 0 };

    return {
      success: "success",
      message: "Global accountability data fetched successfully.",
      data: {
        records,
        total,
        page: Number(page),
        limit: Number(limit),
        summary,
      },
      statusCode: 200,
    };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};

export const getTodayGlobalAccountabilityStats = async (payload: any) => {
  try {
    const {
      company,
      patientIds,
      doctorIds,
      status,
      tooth,
    } = payload;

    const compId = toObjectId(company);
    const matchStage: any = {
      isActive: { $ne: false },
    };

    if (compId) {
      matchStage.company = compId;
    }

    if (Array.isArray(patientIds) && patientIds.length > 0) {
      const pIds = patientIds.map((id: string) => toObjectId(id)).filter(Boolean);
      if (pIds.length > 0) matchStage.patient = { $in: pIds };
    }

    if (Array.isArray(doctorIds) && doctorIds.length > 0) {
      const dIds = doctorIds.map((id: string) => toObjectId(id)).filter(Boolean);
      if (dIds.length > 0) matchStage.doctor = { $in: dIds };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const PaymentModel = require("../../schemas/payment/payment.schema").default;
    const paymentsInPeriod = await PaymentModel.find({
      date: { $gte: todayStart, $lte: todayEnd },
      company: compId
    }).select('workDone');
    const workDoneIdsWithPayments = paymentsInPeriod.map((p: any) => p.workDone);

    matchStage.$or = [
      { _id: { $in: workDoneIdsWithPayments } },
      {
        createdAt: {
          $gte: todayStart,
          $lte: todayEnd
        }
      }
    ];

    if (tooth) {
      matchStage.tooth = { $regex: tooth, $options: "i" };
    }

    if (payload.paymentMode && payload.paymentMode !== "all" && payload.paymentMode !== "undefined") {
      // Handled in paymentMatch earlier if needed, but today stats usually don't filter paymentMode as heavily, or it can be handled via payments lookup
    }

    if (payload.treatmentCode && payload.treatmentCode.trim() !== "") {
      const escapedTreatmentCode = payload.treatmentCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      matchStage["treatmentCode"] = { $regex: new RegExp(escapedTreatmentCode, "i") };
    }

    const summaryPipeline: any[] = [
      { $match: matchStage },
      {
        $addFields: {
          balanceDue: {
            $subtract: [
              { $subtract: [{ $ifNull: ["$amount", 0] }, { $ifNull: ["$discount", 0] }] },
              { $ifNull: ["$receivedAmount", 0] }
            ]
          }
        }
      },
      {
        $lookup: {
          from: "payments",
          let: { workDoneId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$workDone", "$$workDoneId"] },
                date: { $gte: todayStart, $lte: todayEnd }
              }
            }
          ],
          as: "paymentsToday"
        }
      },
      {
        $addFields: {
          amountPaidToday: { $sum: "$paymentsToday.amount" }
        }
      },
      ...(status && status !== "all" ? [{
        $match: {
          balanceDue: status.toLowerCase() === "due" ? { $gt: 0 } : { $lte: 0 }
        }
      }] : []),
      {
        $group: {
          _id: null,
          todayBilled: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$createdAt", todayStart] },
                    { $lte: ["$createdAt", todayEnd] }
                  ]
                },
                { $subtract: [{ $ifNull: ["$amount", 0] }, { $ifNull: ["$discount", 0] }] },
                0
              ]
            }
          },
          todayPaid: { $sum: "$amountPaidToday" },
        },
      }
    ];

    const summaryResult = await WorkDoneSchema.aggregate(summaryPipeline);
    const summary = summaryResult[0] || { todayBilled: 0, todayPaid: 0 };

    return {
      success: "success",
      message: "Today global accountability stats fetched successfully.",
      data: summary,
      statusCode: 200,
    };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};

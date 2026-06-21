import mongoose from "mongoose";
import ReceiptModel from "../../schemas/receipt/receipt.schema";

const toObjectId = (id: any) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(String(id));
  return null;
};

/**
 * Generate next receipt number for a company (REC-00001 format)
 */
const generateReceiptNumber = async (companyId: any) => {
  const lastReceipt = await ReceiptModel.findOne(
    { company: toObjectId(companyId) },
    { receiptNumber: 1 },
    { sort: { createdAt: -1 } }
  );

  let nextNum = 1;
  if (lastReceipt?.receiptNumber) {
    const match = lastReceipt.receiptNumber.match(/(\d+)$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }

  return `REC-${String(nextNum).padStart(5, "0")}`;
};

/**
 * Create a new receipt document (called when downloading a receipt PDF)
 */
export const createReceipt = async (data: any) => {
  try {
    const { patient, workDone, accountability, company, generatedBy, type = "receipt" } = data;

    // Check if an existing receipt was already generated TODAY for this exact criteria
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const matchCriteria: any = {
      patient: toObjectId(patient),
      company: toObjectId(company),
      type: type,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    };

    const exactMatchCriteria = { ...matchCriteria };
    if (workDone) exactMatchCriteria.workDone = toObjectId(workDone);
    if (accountability) exactMatchCriteria.accountability = toObjectId(accountability);

    // 1. Check if we already generated a receipt for this EXACT data today
    const exactExistingReceipt = await ReceiptModel.findOne(exactMatchCriteria);

    if (exactExistingReceipt) {
      return {
        success: "success",
        message: "Existing exact receipt found for today",
        data: exactExistingReceipt,
        statusCode: 200,
      };
    }

    // 2. Since it's a completely new record or different type, generate a brand new receipt number
    const receiptNumber = await generateReceiptNumber(company);

    const newReceipt = new ReceiptModel({
      patient: toObjectId(patient),
      workDone: workDone ? toObjectId(workDone) : null,
      accountability: accountability ? toObjectId(accountability) : null,
      company: toObjectId(company),
      generatedBy: toObjectId(generatedBy),
      type: type,
      receiptNumber
    });

    await newReceipt.save();

    return {
      success: "success",
      message: "Receipt generated successfully",
      data: newReceipt,
      statusCode: 201,
    };
  } catch (error: any) {
    return {
      success: "error",
      message: error.message,
      statusCode: 500,
    };
  }
};

/**
 * Get all receipts for a patient
 */
export const getReceiptsByPatient = async (query: any) => {
  try {
    const { patientId, company, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const matchStage: any = { isActive: true };
    if (patientId) matchStage.patient = toObjectId(patientId);
    if (company) matchStage.company = toObjectId(company);

    const [data, total] = await Promise.all([
      ReceiptModel.find(matchStage)
        .populate("patient", "name mobileNumber code")
        .populate("workDone")
        .populate("accountability")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ReceiptModel.countDocuments(matchStage),
    ]);

    return {
      success: "success",
      data,
      totalPages: Math.ceil(total / Number(limit)),
      statusCode: 200,
    };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};

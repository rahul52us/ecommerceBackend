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
    const { patient, workDone, accountability, company, generatedBy } = data;

    const receiptNumber = await generateReceiptNumber(company);

    const newReceipt = new ReceiptModel({
      receiptNumber,
      patient: toObjectId(patient),
      workDone: toObjectId(workDone),
      accountability: toObjectId(accountability) || undefined,
      company: toObjectId(company),
      generatedBy: toObjectId(generatedBy) || undefined,
    });

    const saved = await newReceipt.save();

    return {
      success: "success",
      message: "Receipt created",
      data: saved,
      statusCode: 201,
    };
  } catch (error: any) {
    console.error("createReceipt error:", error);
    return { success: "error", message: error.message, statusCode: 500 };
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

import {
  createWorkDone,
  getWorkDone,
  deleteWorkDone,
  updateWorkDone,
  getPatientFinancialStats,
  getDoctorFinancialStats,
  getOverallPatientStats,
  getPatientStatementData,
  getSingleWorkDoneStatementData,
  getDoctorWorkDoneReportData,
  getPaymentReceiptData,
  getDailyWorkDoneData,
  getWorkDoneCountByDate,
  assignWorkDoneSittingNo,
  updateWorkDoneAmount,
  getFilteredTablePDFData,
  getReceiptsLogData,
  getGlobalAccountabilityData,
  getTodayGlobalAccountabilityStats,
} from "../../repository/workDone/workDone";
import { createReceipt } from "../../repository/receipt/receipt.repository";
import {
  generateStatementPDF,
  generateSingleRecordPDF,
  generatePaymentReceiptPDF,
  generateWorkDoneReportPDF,
  generateFilteredWorkDoneReportPDF,
  generateDailyWorkDoneReportPDF,
  generateTableDataPDF
} from "../../modules/config/pdfGenerator";
import UserModel from "../../schemas/User/User";
import PatientPrescriptionModel from "../../schemas/prescription/patientPrescription.schema";

export const getOverallPatientStatsService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data }: any = await getOverallPatientStats({
      ...req.query,
    });

    return res.status(statusCode).send({
      status: success,
      message,
      data,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const getPatientFinancialStatsService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data }: any = await getPatientFinancialStats({
      ...req.query,
      doctorId: req.query.doctorId,
    });

    return res.status(statusCode).send({
      status: success,
      message,
      data,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const createWorkDoneService = async (req: any, res: any) => {
  try {
    const { status, statusCode, data, message }: any = await createWorkDone({
      ...req.body,
      user: req.userId,
    });

    return res.status(statusCode).send({
      status,
      message,
      data,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const getWorkDoneService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data, totalItems }: any = await getWorkDone({
      ...req.query,
    });

    return res.status(statusCode).send({
      status: success,
      message,
      data: {
        data,
        totalItems,
      },
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const deleteWorkDoneService = async (req: any, res: any) => {
  try {
    const { status, statusCode, message }: any = await deleteWorkDone({
      workDoneId: req.params.id,
      user: req.userId,
    });

    return res.status(statusCode).send({
      status,
      message,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const updateWorkDoneService = async (req: any, res: any) => {
  try {
    const { status, statusCode, message, data }: any = await updateWorkDone({
      ...req.body,
      id: req.params.id,
      user: req.userId,
    });

    return res.status(statusCode).send({
      status,
      message,
      data,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const updateWorkDoneAmountService = async (req: any, res: any) => {
  try {
    const { status, statusCode, message, data }: any = await updateWorkDoneAmount({
      amount: req.body.amount,
      id: req.params.id,
      user: req.userId,
    });

    return res.status(statusCode).send({
      status,
      message,
      data,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};
export const assignWorkDoneSittingNoService = async (req: any, res: any) => {
  try {
    const { status, statusCode, message, data }: any = await assignWorkDoneSittingNo({
      workDoneId: req.params.id,
      sittingNo: req.body.sittingNo,
      user: req.userId,
    });

    return res.status(statusCode).send({
      status,
      message,
      data,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const getDoctorFinancialStatsService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data }: any = await getDoctorFinancialStats({
      ...req.query,
    });

    return res.status(statusCode).send({
      status: success,
      message,
      data,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const generatePatientStatementService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data }: any = await getPatientStatementData({
      ...req.query,
    });

    if (success === "error") {
      return res.status(statusCode).send({ status: success, message });
    }

    const chunks: any[] = [];
    const stream = new (require("stream").PassThrough)();

    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const base64 = pdfBuffer.toString("base64");
      return res.status(200).send({
        status: "success",
        message: "PDF generated successfully",
        data: base64
      });
    });

    const receiptResult = await createReceipt({
      patient: data.patient?._id,
      company: req.query.company,
      generatedBy: req.userId,
      type: "statement",
    });

    if (receiptResult.success === "success") {
      data.receiptNumber = receiptResult.data?.receiptNumber;
    }

    generateStatementPDF(data, stream);
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

/**
 * SEPARATE SERVICE FOR INDIVIDUAL RECORD RECEIPT
 */
export const generateSingleWorkDonePDFService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data }: any = await getSingleWorkDoneStatementData({
      workDoneId: req.params.id,
      company: req.query.company
    });

    if (success === "error") {
      return res.status(statusCode).send({ status: success, message });
    }

    // Attach empty receipt number to data for PDF since we are moving it to the table rows
    data.receiptNumber = "N/A";

    const chunks: any[] = [];
    const stream = new (require("stream").PassThrough)();

    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const base64 = pdfBuffer.toString("base64");
      return res.status(200).send({
        status: "success",
        message: "Single Record PDF generated successfully",
        data: base64,
        receiptNumber: "N/A",
      });
    });

    generateSingleRecordPDF(data, stream);
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

/**
 * SEPARATE SERVICE FOR DOCTOR-SPECIFIC WORK DONE REPORT
 */
export const generateDoctorWorkDoneReportService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data }: any = await getDoctorWorkDoneReportData({
      ...req.query
    });

    if (success === "error") {
      return res.status(statusCode).send({ status: success, message });
    }

    const chunks: any[] = [];
    const stream = new (require("stream").PassThrough)();

    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const base64 = pdfBuffer.toString("base64");
      return res.status(200).send({
        status: "success",
        message: "Doctor Report generated successfully",
        data: base64
      });
    });

    const { generateDoctorWorkDonePDF } = require("../../modules/config/pdfGenerator");
    generateDoctorWorkDonePDF(data, stream);
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

/**
 * SEPARATE SERVICE FOR INDIVIDUAL PAYMENT RECEIPT
 */
export const generateIndividualPaymentPDFService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data }: any = await getPaymentReceiptData({
      workDoneId: req.params.workDoneId,
      paymentIndex: req.params.paymentIndex,
      company: req.query.company
    });

    if (success === "error") {
      return res.status(statusCode).send({ status: success, message });
    }

    // Check if the payment already has a receipt number
    let receiptNumber = data.payment?.receiptNumber;
    
    // Fallback: Create Receipt document if it doesn't have one (for older legacy payments)
    if (!receiptNumber) {
      const receiptResult = await createReceipt({
        patient: (data.patient as any)?._id || data.patient,
        workDone: data.record._id,
        company: req.query.company,
        generatedBy: req.userId,
        type: "payment", // explicitly use payment to guarantee unique sequence
      });
      receiptNumber = receiptResult?.data?.receiptNumber || "N/A";
      
      // Permanently save this newly generated receipt number back to the database for this specific transaction
      if (receiptNumber !== "N/A") {
        const pIndex = parseInt(req.params.paymentIndex, 10);
        
        // 1. Update WorkDone
        const workDoneRecord = await require("../../schemas/workDone/workDone.schema").default.findById(data.record._id);
        if (workDoneRecord && workDoneRecord.paymentHistory && workDoneRecord.paymentHistory[pIndex]) {
          workDoneRecord.paymentHistory[pIndex].receiptNumber = receiptNumber;
          workDoneRecord.markModified('paymentHistory');
          await workDoneRecord.save();
        }
        
        // 2. Update Accountability
        const accountability = await require("../../schemas/accountability/accountability.schema").default.findOne({ workDone: data.record._id });
        if (accountability && accountability.payoutHistory && accountability.payoutHistory[pIndex]) {
          accountability.payoutHistory[pIndex].receiptNumber = receiptNumber;
          accountability.markModified('payoutHistory');
          await accountability.save();
        }
      }
    }

    // Attach receipt number to data for PDF
    data.record.receiptNumber = receiptNumber;

    const chunks: any[] = [];
    const stream = new (require("stream").PassThrough)();

    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("error", (err: any) => {
      console.error("PDF Stream Error:", err);
      if (!res.headersSent) {
        return res.status(500).send({ status: "error", message: "PDF Stream Error" });
      }
    });
    stream.on("end", () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        const base64 = pdfBuffer.toString("base64");
        return res.status(200).send({
          status: "success",
          message: "Payment Receipt PDF generated successfully",
          data: base64,
          receiptNumber,
        });
      } catch (err: any) {
        if (!res.headersSent) {
          return res.status(500).send({ status: "error", message: "Failed to finalize PDF" });
        }
      }
    });

    generatePaymentReceiptPDF(data, stream);
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};
/**
 * NEW SERVICE FOR WORK DONE REPORT WITH PRESCRIPTIONS
 */
export const generateWorkDoneReportService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data }: any = await getSingleWorkDoneStatementData({
      workDoneId: req.params.id,
      company: req.query.company
    });

    if (success === "error") {
      return res.status(statusCode).send({ status: success, message });
    }

    const chunks: any[] = [];
    const stream = new (require("stream").PassThrough)();

    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const base64 = pdfBuffer.toString("base64");
      return res.status(200).send({
        status: "success",
        message: "Work Done Report PDF generated successfully",
        data: base64
      });
    });

    console.log("thi i called")

    const reportType = req.query.reportType || req.body.reportType || "both";

    generateWorkDoneReportPDF({
      ...data,
      prescriptions: req.body.prescriptions,
      topPadding: req.body.topPadding,
      bottomPadding: req.body.bottomPadding,
      reportType
    }, stream);
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};
export const generateDailyWorkDoneReportService = async (req: any, res: any) => {
  try {
    const { patientId } = req.params;
    const { date, company } = req.query;
    const reportType = req.query.reportType || req.body.reportType || "both";
    const { prescriptions, topPadding, bottomPadding } = req.body;

    let records: any[] = [];
    let patient: any = null;

    if (reportType === "prescription") {
      // For daily prescriptions, we bypass the procedures check entirely
      patient = await UserModel.findById(patientId)
        .select("name mobileNumber code profile_details")
        .populate({
          path: "profile_details",
          model: "ProfileDetails"
        });
    } else {
      // For procedures or combined summary, fetch daily records
      const result: any = await getDailyWorkDoneData({
        patientId,
        date: date as string,
        company: company as string
      });

      if (result.success === "error") {
        return res.status(result.statusCode).send({ status: "error", message: result.message });
      }

      records = result.data || [];
      patient = records[0]?.patient;
    }

    const chunks: any[] = [];
    const stream = new (require("stream").PassThrough)();

    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const base64 = pdfBuffer.toString("base64");
      return res.status(200).send({
        status: "success",
        message: "Daily Report generated successfully",
        data: base64
      });
    });

    generateDailyWorkDoneReportPDF({
      records,
      patient,
      date: date as string,
      prescriptions,
      topPadding,
      bottomPadding,
      reportType
    }, stream);
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const getWorkDoneCountByDateService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data }: any = await getWorkDoneCountByDate({
      patientId: req.query.patientId,
      company: req.query.company,
    });

    return res.status(statusCode).send({
      status: success,
      message,
      data,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const generateFilteredWorkDoneReportService = async (req: any, res: any) => {
  try {
    const { patientId } = req.params;
    const { company, treatmentId, fromDate, toDate, doctorId, toothNumber, reportType, sittingNo } = req.query;
    const { prescriptions, topPadding, bottomPadding } = req.body;

    const result: any = await getWorkDone({
      patientId,
      treatmentId,
      company,
      fromDate,
      toDate,
      doctorId,
      toothNumber,
      sittingNo,
      limit: 1000,
      page: 1
    });

    if (result.success === "error") {
      return res.status(result.statusCode).send({ status: "error", message: result.message });
    }

    const records = result.data?.data || result.data || [];
    if (records.length === 0) {
      return res.status(404).send({ status: "error", message: "No records found for this filter" });
    }

    const patient = await UserModel.findById(patientId)
      .select("name mobileNumber code profile_details")
      .populate({
        path: "profile_details",
        model: "ProfileDetails"
      });

    // Extract unique dates from the records in YYYY-MM-DD format
    const uniqueDates = Array.from(new Set(records.map((r: any) => {
      const d = new Date(r.createdAt || Date.now());
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })));

    // Fetch prescriptions from the db in backend directly for the workdone dates
    const patientPrescriptions = await PatientPrescriptionModel.find({
      patient: patientId,
      date: { $in: uniqueDates }
    }).lean();

    let dbPrescriptions: any[] = [];
    patientPrescriptions.forEach((pp: any) => {
      if (pp.prescriptions && Array.isArray(pp.prescriptions)) {
        dbPrescriptions = dbPrescriptions.concat(pp.prescriptions);
      }
    });

    const chunks: any[] = [];
    const stream = new (require("stream").PassThrough)();

    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const base64 = pdfBuffer.toString("base64");
      return res.status(200).send({
        status: "success",
        message: "Filtered Report generated successfully",
        data: base64
      });
    });

    generateFilteredWorkDoneReportPDF({
      records: records,
      patient,
      prescriptions: dbPrescriptions,
      topPadding,
      bottomPadding,
      reportType: reportType || "both"
    }, stream);

  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const generateFilteredTablePDFService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data }: any = await getFilteredTablePDFData({
      ...req.query,
      patientId: req.params.patientId
    });

    if (success === "error") {
      return res.status(statusCode).send({ status: success, message });
    }

    const chunks: any[] = [];
    const stream = new (require("stream").PassThrough)();

    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const base64 = pdfBuffer.toString("base64");
      return res.status(200).send({
        status: "success",
        message: "Table PDF generated successfully",
        data: base64
      });
    });

    generateTableDataPDF(data, stream);
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const generateReceiptsLogPDFService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data }: any = await getReceiptsLogData({
      ...req.query,
      patientId: req.params.patientId
    });

    if (success === "error") {
      return res.status(statusCode).send({ status: success, message });
    }

    const chunks: any[] = [];
    const stream = new (require("stream").PassThrough)();

    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const base64 = pdfBuffer.toString("base64");
      return res.status(200).send({
        status: "success",
        message: "Receipts Log PDF generated successfully",
        data: base64
      });
    });

    const { generateReceiptsLogPDF } = require("../../modules/config/pdfGenerator");
    generateReceiptsLogPDF(data, stream);
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const getGlobalAccountabilityDataService = async (req: any, res: any) => {
  try {
    const payload = {
      ...req.body,
      company: req.body.company || req.bodyData?.company,
    };

    const { statusCode, success, message, data }: any = await getGlobalAccountabilityData(payload);

    return res.status(statusCode).send({
      status: success,
      message,
      data,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const generateGlobalAccountabilityReportService = async (req: any, res: any) => {
  try {
    const payload = {
      ...req.body,
      company: req.body.company || req.bodyData?.company,
      limit: 1000, // Limit to 1000 for PDF report to avoid extreme server load
      page: 1
    };

    const { statusCode, success, message, data }: any = await getGlobalAccountabilityData(payload);

    if (success === "error") {
      return res.status(statusCode).send({ status: "error", message });
    }

    const chunks: any[] = [];
    const stream = new (require("stream").PassThrough)();

    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const base64 = pdfBuffer.toString("base64");
      return res.status(200).send({
        status: "success",
        message: "Report generated successfully",
        data: base64
      });
    });

    const { generateGlobalAccountabilityPDF } = require("../../modules/config/pdfGenerator");
    generateGlobalAccountabilityPDF(data, stream, req.body.columns);
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const getTodayGlobalAccountabilityStatsService = async (req: any, res: any) => {
  try {
    const payload = {
      ...req.body,
      company: req.body.company || req.bodyData?.company,
    };

    const { statusCode, success, message, data }: any = await getTodayGlobalAccountabilityStats(payload);

    return res.status(statusCode).send({
      status: success,
      message,
      data,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

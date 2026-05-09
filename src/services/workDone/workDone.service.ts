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
} from "../../repository/workDone/workDone";
import { generateStatementPDF, generateSingleRecordPDF, generatePaymentReceiptPDF, generateWorkDoneReportPDF } from "../../modules/config/pdfGenerator";

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

    const chunks: any[] = [];
    const stream = new (require("stream").PassThrough)();

    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const base64 = pdfBuffer.toString("base64");
      return res.status(200).send({
        status: "success",
        message: "Single Record PDF generated successfully",
        data: base64
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
          data: base64
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

    generateWorkDoneReportPDF({ 
      ...data, 
      prescriptions: req.body.prescriptions, 
      topPadding: req.body.topPadding, 
      bottomPadding: req.body.bottomPadding 
    }, stream);
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

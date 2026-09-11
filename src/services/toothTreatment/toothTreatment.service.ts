import mongoose from "mongoose";

import {
  createToothTreatment,
  updateToothTreatment,
  updateToothTreatmentStatus,
  getToothTreatments,
  getTodayToothTreatments,
  getTodayToothCount,
  getToothTreatmentById,
  deleteToothTreatment,
  getTreatmentCountByDate,
  getTreatmentsBySitting,
  assignSittingNo,
  getFilteredTreatmentTablePDFData,
} from "../../repository/toothTreatment/toothTreatment";
import { generateTreatmentTableDataPDF } from "../../modules/config/pdfGenerator";
import { Writable } from "stream";


export const getToothTreatmentByIdService = async (req: any, res: any) => {
  try {
    console.log("BACKEND: Fetching Treatment with ID:", req.params.id, "Company:", req.query?.company);
    const { statusCode, success, message, data }: any =
      await getToothTreatmentById({
        treatmentId: new mongoose.Types.ObjectId(req.params.id),
        company: req.body?.company || req.bodyData?.company || req.query?.company,
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

/* =====================================================
   GET TOOTH TREATMENTS (LIST)
===================================================== */
export const getToothTreatmentsService = async (req: any, res: any) => {
  try {
    console.log("INCOMING GET TREATMENTS REQ:", { ...req.body, ...req.query });
    const { statusCode, success, message, data, count, totalItems }: any =
      await getToothTreatments({
        ...req.body,
        ...req.query,
        company: req.body?.company || req.query?.company,
      });

    return res.status(statusCode).send({
      status: success,
      message,
      data: {
        data,
        totalItems: totalItems || count,
      },
    });
  } catch (err: any) {
    console.log(err)
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

/* =====================================================
   GET TODAY'S TOOTH TREATMENTS (SESSION)
==================================================== */
export const getTodayToothTreatmentsService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data, totalItems }: any =
      await getTodayToothTreatments({
        ...req.query,
        patientId: req.query.patientId,
        company: req.query.company,
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

/* =====================================================
   GET TODAY'S TOOTH COUNT (SESSION)
==================================================== */
export const getTodayCountService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, totalItems }: any =
      await getTodayToothCount({
        ...req.query,
        patientId: req.query.patientId,
        company: req.query.company,
      });

    return res.status(statusCode).send({
      status: success,
      message,
      data: {
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

/* =====================================================
   CREATE TOOTH TREATMENT
===================================================== */
export const createToothTreatmentService = async (req: any, res: any) => {
  try {
    console.log("CREATING TREATMENT PAYLOAD:", { ...req.body, user: req.userId });
    const { status, statusCode, data, message }: any =
      await createToothTreatment({
        ...req.body,
        user: req.userId, // createdBy
        company: req.body.company,
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

/* =====================================================
   UPDATE TOOTH TREATMENT
===================================================== */
export const updateToothTreatmentService = async (req: any, res: any): Promise<any> => {
  try {
    console.log("UPDATING TREATMENT PAYLOAD:", { ...req.body, treatmentId: req.params.id });
    const { status, statusCode, data, message }: any =
      await updateToothTreatment({
        ...req.body,
        treatmentId: new mongoose.Types.ObjectId(req.params.id),
        user: req.userId, // updatedBy
        company: req.body.company,
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

/* =====================================================
   UPDATE TOOTH TREATMENT STATUS
===================================================== */
export const updateToothTreatmentStatusService = async (
  req: any,
  res: any
) => {
  try {
    const { status, statusCode, data, message }: any =
      await updateToothTreatmentStatus({
        ...req.body,
        treatmentId: new mongoose.Types.ObjectId(req.params.id),
        user: req.userId,
        company: req.body.company,
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

/* =====================================================
   DELETE (SOFT DELETE) TOOTH TREATMENT
===================================================== */
export const deleteToothTreatmentService = async (req: any, res: any) => {
  try {
    const { status, statusCode, message }: any =
      await deleteToothTreatment({
        treatmentId: new mongoose.Types.ObjectId(req.params.id),
        user: req.userId,
        company: req.body.company,
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

/* =====================================================
   GET TREATMENT COUNT BY DATE (AGGREGATION)
==================================================== */
export const getTreatmentCountByDateService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data }: any =
      await getTreatmentCountByDate({
        ...req.query,
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

/* =====================================================
   GET TREATMENTS BY SITTING NO
==================================================== */
export const getTreatmentsBySittingService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data, totalItems }: any =
      await getTreatmentsBySitting({
        ...req.query,
        patientId: req.query.patientId,
        company: req.query.company,
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

/* =====================================================
   ASSIGN SITTING NO
===================================================== */
export const assignSittingNoService = async (
  req: any,
  res: any
) => {
  try {
    const { status, statusCode, data, message }: any =
      await assignSittingNo({
        ...req.body,
        treatmentId: new mongoose.Types.ObjectId(req.params.id),
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

/* =====================================================
   GENERATE FILTERED TREATMENT TABLE PDF SERVICE
===================================================== */
export const generateFilteredTreatmentTablePDFService = async (req: any, res: any) => {
  try {
    const { patientId } = req.params;
    const { statusCode, success, message, data }: any = await getFilteredTreatmentTablePDFData({
      ...req.query,
      patientId,
      company: req.query.company
    });

    if (success === "error") {
      return res.status(statusCode || 500).send({ status: "error", message });
    }

    const chunks: any[] = [];
    const stream = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      }
    });

    generateTreatmentTableDataPDF(data, stream);

    stream.on('finish', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Filtered_Treatment_Table_${patientId}.pdf"`);
      return res.status(200).send(pdfBuffer.toString('base64'));
    });

  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Error generating treatment table PDF"
    });
  }
};

export const generateGlobalFilteredTreatmentTablePDFService = async (req: any, res: any) => {
  try {
    const { getGlobalFilteredTreatmentTablePDFData } = await import("../../repository/toothTreatment/toothTreatment");
    const { success, message, data }: any = await getGlobalFilteredTreatmentTablePDFData(req.query);

    if (success === "error") {
      return res.status(400).send({ status: "error", message });
    }

    const { generateGlobalTreatmentTableDataPDF } = await import("../../modules/config/pdfGenerator");
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="Global_Treatment_Report.pdf"');

    generateGlobalTreatmentTableDataPDF(data, res);
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Error generating global treatment table PDF"
    });
  }
};

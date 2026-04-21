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
} from "../../repository/toothTreatment/toothTreatment";


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
export const updateToothTreatmentService = async (req: any, res: any) => {
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


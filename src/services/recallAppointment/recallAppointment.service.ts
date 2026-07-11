import mongoose from "mongoose";
import {
  updateRecallAppointment,
  updateRecallStatus,
  getRecallAppointments,
  getRecallAppointmentById,
  deleteRecallAppointment,
  createRecallAppointment,
  getTodayPendingRecallAppointments
} from "../../repository/recallAppointment/recallAppointment.repository";

/* =====================================================
   GET RECALL APPOINTMENT BY ID
===================================================== */
export const getRecallAppointmentByIdService = async (req: any, res: any) => {
  try {
    const { success, message, data, statusCode }: any =
      await getRecallAppointmentById({
        recallId: req.params.id,
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
   GET RECALL APPOINTMENTS (LIST)
===================================================== */
export const getRecallAppointmentsService = async (req: any, res: any) => {
  try {
    const { success, message, data, count, statusCode }: any =
      await getRecallAppointments({
        ...req.body,
        ...req.query,
        company: req.body?.company || req.query?.company,
        id: req.userId,
        userType: req.bodyData?.userType
      });

    return res.status(statusCode).send({
      status: success,
      message,
      data,
      totalRecords: count,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

/* =====================================================
   GET TODAY'S PENDING RECALL APPOINTMENTS
===================================================== */
export const getTodayPendingRecallAppointmentsService = async (req: any, res: any) => {
  try {
    const { success, message, data, count, statusCode }: any =
      await getTodayPendingRecallAppointments({
        ...req.body,
        ...req.query,
        company: req.body?.company || req.query?.company,
        id: req.userId,
        userType: req.bodyData?.userType
      });

    return res.status(statusCode).send({
      status: success,
      message,
      data,
      totalRecords: count,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

/* =====================================================
   CREATE RECALL APPOINTMENT
===================================================== */
export const createRecallAppointmentService = async (req: any, res: any) => {
  try {
    const { success, message, data, statusCode }: any =
      await createRecallAppointment({
        ...req.body,
        user: req.userId,
        company: req.body.company,
      });

    return res.status(statusCode).send({
      status: success,
      message,
      data,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message,
    });
  }
};

/* =====================================================
   UPDATE RECALL APPOINTMENT
===================================================== */
export const updateRecallAppointmentService = async (req: any, res: any) => {
  try {
    const { success, message, data, statusCode }: any =
      await updateRecallAppointment({
        ...req.body,
        recallId: new mongoose.Types.ObjectId(req.params.id),
        user: req.userId,
      });

    return res.status(statusCode).send({
      status: success,
      message,
      data,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message,
    });
  }
};

/* =====================================================
   UPDATE RECALL STATUS
===================================================== */
export const updateRecallAppointmentStatusService = async (
  req: any,
  res: any
) => {
  try {
    const { success, message, data, statusCode }: any =
      await updateRecallStatus({
        ...req.body,
        recallId: new mongoose.Types.ObjectId(req.params.id),
        user: req.userId,
      });

    return res.status(statusCode).send({
      status: success,
      message,
      data,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message,
    });
  }
};

/* =====================================================
   DELETE RECALL APPOINTMENT
===================================================== */
export const deleteRecallAppointmentService = async (req: any, res: any) => {
  try {
    const { success, message, statusCode }: any =
      await deleteRecallAppointment({
        recallId: new mongoose.Types.ObjectId(req.params.id),
      });

    return res.status(statusCode).send({
      status: success,
      message,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message,
    });
  }
};

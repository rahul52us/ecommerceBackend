import mongoose from "mongoose";
import { createAppointment, getAppointmentById, getAppointments, getAppointmentStatusCounts, getPatientHistory, updateAppointment, updateAppointmentStatus } from "../../repository/doctorAppointments/doctorAppointments";





export const getAppointmentByIdService = async (req: any, res: any) => {
  try {

    const { statusCode, success, message, data, count }: any = await getAppointmentById({
      ...req.body,
      userType:req.bodyData?.userType,
      userId : req.userId,
      company: req.body?.company || req.query?.company,
    });

    return res.status(statusCode).send({
      status: success,
      message,
      data : {data , totalPages : count},
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const getDoctorAppointmentsService = async (req: any, res: any) => {
  try {

    const { statusCode, success, message, data, totalPages }: any = await getAppointments({
      ...req.body,
      userType:req.bodyData?.userType,
      userId : req.userId,
      company: req.body?.company || req.query?.company,
    });

    return res.status(statusCode).send({
      status: success,
      message,
      data : {data , totalPages : totalPages},
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};


export const createDoctorAppointmentService = async (req: any, res: any) => {
  try {
    const { status, statusCode, data, message }: any = await createAppointment({
      ...req.body,
      user: req.userId,
      company: req.body.company,
    });
    return res.status(statusCode).send({
      message,
      data,
      status,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message,
    });
  }
};

export const updateDoctorAppointmentService = async (req: any, res: any) => {
  try {
    const { status, statusCode, data, message }: any = await updateAppointment({
      ...req.body,
      user: req.userId,
      appointmentId : new mongoose.Types.ObjectId(req.params.id),
      company: req.body.company,
    });
    return res.status(statusCode).send({
      message,
      data,
      status,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message,
    });
  }
};


export const updateDoctorAppointmentStatusService = async (req: any, res: any) => {
  try {
    const { success, statusCode, data, message }: any = await updateAppointmentStatus({
      ...req.body,
      appointmentId : new mongoose.Types.ObjectId(req.params.id),
      user: req.userId,
      company: req.body.company,
    });
    return res.status(statusCode).send({
      message,
      data,
      status: success,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message,
    });
  }
};

export const completeDoctorAppointmentService = async (req: any, res: any) => {
  try {
    const { success, statusCode, data, message }: any = await updateAppointmentStatus({
      status: "completed",
      remarks: "Completed from Waiting Room",
      appointmentId: new mongoose.Types.ObjectId(req.params.id),
      user: req.userId,
      company: req.body.company || req.query.company,
    });
    return res.status(statusCode).send({
      message,
      data,
      status: success,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message,
    });
  }
};

export const getAppointmentStatusCountsService = async (req: any, res: any) => {
  try {
    const { status, statusCode, data, message }: any = await getAppointmentStatusCounts({
      ...req.body,
      company: req.body.company,
    });
    return res.status(statusCode).send({
      message,
      data,
      status,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message,
    });
  }
};

export const getPatientHistoryService = async (req: any, res: any) => {
  try {
    const { patientId, page, limit } = { ...req.params, ...req.body, ...req.query };
    const company = req.body.company || req.query.company || req.headers['company'];

    console.log(`📡 API Request: POST /patients/history/${patientId}`, { page, limit });

    const { status, statusCode, data, message, totalCount, totalPages, currentPage }: any = await getPatientHistory({
      patientId,
      company,
      page,
      limit,
    });
    return res.status(statusCode).send({
      message,
      data,
      totalCount,
      totalPages,
      currentPage,
      status,
    });
  } catch (err: any) {
    console.error("❌ getPatientHistoryService error:", err);
    return res.status(500).send({
      status: "error",
      message: err?.message,
    });
  }
};

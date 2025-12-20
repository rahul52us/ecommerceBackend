import mongoose from "mongoose";
import { createAppointment, getAppointments, getAppointmentStatusCounts, updateAppointment, updateAppointmentStatus } from "../../repository/doctorAppointments/doctorAppointments";


export const getDoctorAppointmentsService = async (req: any, res: any) => {
  try {

    const { statusCode, success, message, data, count }: any = await getAppointments({
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
    const { status, statusCode, data, message }: any = await updateAppointmentStatus({
      ...req.body,
      appointmentId : new mongoose.Types.ObjectId(req.params.id),
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


import express from "express";
import authenticate from "../../modules/config/authenticate";
import { createDoctorAppointmentService, getAppointmentStatusCountsService, getDoctorAppointmentsService, updateDoctorAppointmentStatusService } from "../../services/doctorAppointments/doctorAppointments.service";

const doctorAppointmentRouting = express.Router();
doctorAppointmentRouting.post("/create", authenticate, createDoctorAppointmentService);
doctorAppointmentRouting.post('/get',authenticate,getDoctorAppointmentsService)
doctorAppointmentRouting.put('/status/:id',authenticate,updateDoctorAppointmentStatusService)
doctorAppointmentRouting.post('/patients/status/count',authenticate,getAppointmentStatusCountsService)

export default doctorAppointmentRouting;
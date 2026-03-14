import express from "express";
import authenticate from "../../modules/config/authenticate";
import { createDoctorAppointmentService, getAppointmentByIdService, getAppointmentStatusCountsService, getDoctorAppointmentsService, getPatientHistoryService, updateDoctorAppointmentService, updateDoctorAppointmentStatusService } from "../../services/doctorAppointments/doctorAppointments.service";

const doctorAppointmentRouting = express.Router();
doctorAppointmentRouting.post("/create", authenticate, createDoctorAppointmentService);
doctorAppointmentRouting.post('/get',authenticate,getDoctorAppointmentsService)
doctorAppointmentRouting.post('/AppointmentById',authenticate,getAppointmentByIdService)
doctorAppointmentRouting.put('/status/:id',authenticate,updateDoctorAppointmentStatusService)
doctorAppointmentRouting.post('/patients/status/count',authenticate,getAppointmentStatusCountsService)
doctorAppointmentRouting.post('/patients/history/:patientId', authenticate, getPatientHistoryService);
doctorAppointmentRouting.put('/update/:id',authenticate,updateDoctorAppointmentService)

export default doctorAppointmentRouting;
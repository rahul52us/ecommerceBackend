import express from "express";
import authenticate from "../../modules/config/authenticate";
import { createDoctorAppointmentService, getAppointmentByIdService, getAppointmentStatusCountsService, getDoctorAppointmentsService, getPatientHistoryService, updateDoctorAppointmentService, updateDoctorAppointmentStatusService, completeDoctorAppointmentService, getPatientAuditTrailService } from "../../services/doctorAppointments/doctorAppointments.service";

const doctorAppointmentRouting = express.Router();
doctorAppointmentRouting.post("/create", authenticate, createDoctorAppointmentService);
doctorAppointmentRouting.post('/get', authenticate, getDoctorAppointmentsService)
doctorAppointmentRouting.post('/AppointmentById', authenticate, getAppointmentByIdService)
doctorAppointmentRouting.put('/status/:id', authenticate, updateDoctorAppointmentStatusService)
doctorAppointmentRouting.put('/complete/:id', authenticate, completeDoctorAppointmentService)
doctorAppointmentRouting.post('/patients/status/count', authenticate, getAppointmentStatusCountsService)
doctorAppointmentRouting.post('/patients/history/:patientId', authenticate, getPatientHistoryService);
doctorAppointmentRouting.post('/patients/audit-trail/:patientId', authenticate, getPatientAuditTrailService);
doctorAppointmentRouting.put('/update/:id', authenticate, updateDoctorAppointmentService)

export default doctorAppointmentRouting;
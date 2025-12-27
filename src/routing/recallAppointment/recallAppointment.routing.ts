import express from "express";
import authenticate from "../../modules/config/authenticate";
import {
  createRecallAppointmentService,
  getRecallAppointmentsService,
  getRecallAppointmentByIdService,
  updateRecallAppointmentService,
  deleteRecallAppointmentService,
  updateRecallAppointmentStatusService,
} from "../../services/recallAppointment/recallAppointment.service";

const recallAppointmentRouting = express.Router();

recallAppointmentRouting.post(
  "/create",
  authenticate,
  createRecallAppointmentService
);

recallAppointmentRouting.post(
  "/get",
  authenticate,
  getRecallAppointmentsService
);

recallAppointmentRouting.post(
  "/RecallAppointmentById/:id",
  authenticate,
  getRecallAppointmentByIdService
);

recallAppointmentRouting.put(
  "/update/:id",
  authenticate,
  updateRecallAppointmentService
);

recallAppointmentRouting.put(
  "/status/:id",
  authenticate,
  updateRecallAppointmentStatusService
);

recallAppointmentRouting.delete(
  "/delete/:id",
  authenticate,
  deleteRecallAppointmentService
);

export default recallAppointmentRouting;

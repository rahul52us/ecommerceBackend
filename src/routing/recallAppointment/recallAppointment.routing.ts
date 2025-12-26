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

/* =====================================================
   CREATE RECALL APPOINTMENT
===================================================== */
recallAppointmentRouting.post(
  "/create",
  authenticate,
  createRecallAppointmentService
);

/* =====================================================
   GET RECALL APPOINTMENTS (LIST + FILTERS)
===================================================== */
recallAppointmentRouting.post(
  "/get",
  authenticate,
  getRecallAppointmentsService
);

/* =====================================================
   GET RECALL APPOINTMENT BY ID
===================================================== */
recallAppointmentRouting.post(
  "/RecallAppointmentById/:id",
  authenticate,
  getRecallAppointmentByIdService
);

/* =====================================================
   UPDATE RECALL APPOINTMENT
===================================================== */
recallAppointmentRouting.put(
  "/update/:id",
  authenticate,
  updateRecallAppointmentService
);

/* =====================================================
   UPDATE RECALL STATUS
===================================================== */
recallAppointmentRouting.put(
  "/status/:id",
  authenticate,
  updateRecallAppointmentStatusService
);

/* =====================================================
   DELETE RECALL APPOINTMENT
===================================================== */
recallAppointmentRouting.delete(
  "/delete/:id",
  authenticate,
  deleteRecallAppointmentService
);

export default recallAppointmentRouting;

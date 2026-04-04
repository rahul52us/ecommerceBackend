import express from "express";
import authenticate from "../../modules/config/authenticate";
import { createToothTreatmentService, deleteToothTreatmentService, getToothTreatmentByIdService, getToothTreatmentsService, updateToothTreatmentService, updateToothTreatmentStatusService } from "../../services/toothTreatment/toothTreatment.service";

const toothTreatment = express.Router();
toothTreatment.post("/create", authenticate, createToothTreatmentService);
toothTreatment.get("/get",authenticate, getToothTreatmentsService);
toothTreatment.get("/:id",authenticate, getToothTreatmentByIdService);
toothTreatment.put("/:id",authenticate, updateToothTreatmentService);
toothTreatment.put("/:id/status",authenticate, updateToothTreatmentStatusService);
toothTreatment.delete("/:id",authenticate, deleteToothTreatmentService);

export default toothTreatment;
import express from "express";
import authenticate from "../../modules/config/authenticate";
import { createToothTreatmentService, deleteToothTreatmentService, getTodayCountService, getTodayToothTreatmentsService, getToothTreatmentByIdService, getToothTreatmentsService, updateToothTreatmentService, updateToothTreatmentStatusService, getTreatmentCountByDateService, getTreatmentsBySittingService, assignSittingNoService, generateFilteredTreatmentTablePDFService } from "../../services/toothTreatment/toothTreatment.service";

const toothTreatment = express.Router();
toothTreatment.post("/create", authenticate, createToothTreatmentService);
toothTreatment.get("/get", authenticate, getToothTreatmentsService);
toothTreatment.get("/today", authenticate, getTodayToothTreatmentsService);
toothTreatment.get("/today-count", authenticate, getTodayCountService);
toothTreatment.get("/count-by-date", authenticate, getTreatmentCountByDateService);
toothTreatment.get("/by-sitting", authenticate, getTreatmentsBySittingService);
toothTreatment.get("/:id", authenticate, getToothTreatmentByIdService);
toothTreatment.get("/generate-filtered-table-pdf/:patientId", authenticate, generateFilteredTreatmentTablePDFService);

toothTreatment.put("/:id", authenticate, updateToothTreatmentService);
toothTreatment.put("/:id/sitting", authenticate, assignSittingNoService);
toothTreatment.put("/:id/status", authenticate, updateToothTreatmentStatusService);
toothTreatment.delete("/:id", authenticate, deleteToothTreatmentService);

export default toothTreatment;
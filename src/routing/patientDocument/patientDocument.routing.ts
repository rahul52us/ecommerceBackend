import express from "express";
import authenticate from "../../modules/config/authenticate";
import {
  createPatientDocumentService,
  getPatientDocumentsService,
  deletePatientDocumentService,
} from "../../services/patientDocument/patientDocument.service";

const patientDocumentRouting = express.Router();

patientDocumentRouting.post("/create", authenticate, createPatientDocumentService);
patientDocumentRouting.get("/get", authenticate, getPatientDocumentsService);
patientDocumentRouting.delete("/:id", authenticate, deletePatientDocumentService);

export default patientDocumentRouting;

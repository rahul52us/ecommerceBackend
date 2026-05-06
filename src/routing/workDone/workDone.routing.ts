import express from "express";
import authenticate from "../../modules/config/authenticate";
import {
  createWorkDoneService,
  getWorkDoneService,
  deleteWorkDoneService,
  updateWorkDoneService,
  getPatientFinancialStatsService,
  getDoctorFinancialStatsService,
  getOverallPatientStatsService,
  generatePatientStatementService,
  generateSingleWorkDonePDFService,
  generateDoctorWorkDoneReportService,
} from "../../services/workDone/workDone.service";

const workDone = express.Router();

workDone.post("/create", authenticate, createWorkDoneService);
workDone.get("/get", authenticate, getWorkDoneService);
workDone.get("/stats", authenticate, getPatientFinancialStatsService);
workDone.get("/overall-stats", authenticate, getOverallPatientStatsService);
workDone.get("/doctor-stats", authenticate, getDoctorFinancialStatsService);
workDone.get("/generate-pdf", authenticate, generatePatientStatementService);
workDone.get("/generate-receipt/:id", authenticate, generateSingleWorkDonePDFService);
workDone.get("/generate-doctor-report", authenticate, generateDoctorWorkDoneReportService);
workDone.put("/:id", authenticate, updateWorkDoneService);
workDone.delete("/:id", authenticate, deleteWorkDoneService);

export default workDone;

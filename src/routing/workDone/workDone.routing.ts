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
  generateIndividualPaymentPDFService,
  generateWorkDoneReportService,
  generateDailyWorkDoneReportService,
  getWorkDoneCountByDateService,
  generateFilteredWorkDoneReportService,
  assignWorkDoneSittingNoService,
  generateFilteredTablePDFService,
  generateGlobalFilteredTablePDFService,
  updateWorkDoneAmountService,
  generateReceiptsLogPDFService,
  getGlobalAccountabilityDataService,
  generateGlobalAccountabilityReportService,
  getTodayGlobalAccountabilityStatsService,
  generateMonthlyPatientReportService,
} from "../../services/workDone/workDone.service";

const workDone = express.Router();

workDone.post("/create", authenticate, createWorkDoneService);
workDone.get("/get", authenticate, getWorkDoneService);
workDone.get("/count-by-date", authenticate, getWorkDoneCountByDateService);
workDone.get("/stats", authenticate, getPatientFinancialStatsService);
workDone.get("/overall-stats", authenticate, getOverallPatientStatsService);
workDone.get("/doctor-stats", authenticate, getDoctorFinancialStatsService);
workDone.get("/generate-pdf", authenticate, generatePatientStatementService);
workDone.get("/generate-receipt/:id", authenticate, generateSingleWorkDonePDFService);
workDone.get("/generate-payment-receipt/:workDoneId/:paymentId", authenticate, generateIndividualPaymentPDFService);
workDone.get("/generate-doctor-report", authenticate, generateDoctorWorkDoneReportService);
workDone.post("/generate-workdone-report/:id", authenticate, generateWorkDoneReportService);
workDone.post("/generate-daily-report/:patientId", authenticate, generateDailyWorkDoneReportService);
workDone.post("/generate-filtered-report/:patientId", authenticate, generateFilteredWorkDoneReportService);
workDone.get("/generate-filtered-table-pdf/:patientId", authenticate, generateFilteredTablePDFService);
workDone.get("/generate-global-filtered-table-pdf", authenticate, generateGlobalFilteredTablePDFService);
workDone.get("/generate-receipts-log/:patientId", authenticate, generateReceiptsLogPDFService);
workDone.post("/global-accountability", authenticate, getGlobalAccountabilityDataService);
workDone.post("/global-accountability/today-stats", authenticate, getTodayGlobalAccountabilityStatsService);
workDone.post("/generate-global-accountability-report", authenticate, generateGlobalAccountabilityReportService);
workDone.post("/generate-monthly-patient-report", authenticate, generateMonthlyPatientReportService);
workDone.put("/assign-sitting/:id", authenticate, assignWorkDoneSittingNoService);
workDone.put("/update-amount/:id", authenticate, updateWorkDoneAmountService);
workDone.put("/:id", authenticate, updateWorkDoneService);
workDone.delete("/:id", authenticate, deleteWorkDoneService);

export default workDone;

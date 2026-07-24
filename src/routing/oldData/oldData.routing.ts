import express from "express";
import authenticate from "../../modules/config/authenticate";
import {
  getOldWorkCompService,
  getOldToothWorkService,
  getOldTransactionService,
  getOldWorkFeeService,
  getLegacyRecordDetailsService,
  getLegacyPatientHistoryService,
  generateOldWorkCompReportService,
  generateOldToothWorkReportService,
  generateOldTransactionReportService,
  generateOldWorkFeeReportService
} from "../../services/oldData/oldData.service";

const oldData = express.Router();

oldData.get("/work-comp", authenticate, getOldWorkCompService);
oldData.get("/tooth-work", authenticate, getOldToothWorkService);
oldData.get("/transactions", authenticate, getOldTransactionService);
oldData.get("/work-fees", authenticate, getOldWorkFeeService);
oldData.get("/legacy-record-details/:legacyWrkDoneId", authenticate, getLegacyRecordDetailsService);
oldData.get("/patient-history/:legacyPatCode", authenticate, getLegacyPatientHistoryService);

// Report Generation Endpoints
oldData.post("/generate-work-comp-report", authenticate, generateOldWorkCompReportService);
oldData.post("/generate-tooth-work-report", authenticate, generateOldToothWorkReportService);
oldData.post("/generate-transactions-report", authenticate, generateOldTransactionReportService);
oldData.post("/generate-work-fees-report", authenticate, generateOldWorkFeeReportService);

export default oldData;

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
  generateOldWorkFeeReportService,
  getPatientOldDataService,
} from "../../services/oldData/oldData.service";
import { importExcelService } from "../../services/oldData/importExcel.service";

const oldData = express.Router();

oldData.get("/work-comp", authenticate, getOldWorkCompService);
oldData.get("/tooth-work", authenticate, getOldToothWorkService);
oldData.get("/transactions", authenticate, getOldTransactionService);
oldData.get("/work-fees", authenticate, getOldWorkFeeService);
oldData.get("/legacy-record-details/:legacyWrkDoneId", authenticate, getLegacyRecordDetailsService);
oldData.get("/patient-history/:legacyPatCode", authenticate, getLegacyPatientHistoryService);

// Excel Patient Import — file is sent as base64 string in JSON body: { "file": "<base64>" }
oldData.post("/import-excel", authenticate, importExcelService);

// Fetch OldData (Excel-imported) for a specific patient by their MongoDB userId
oldData.get("/by-patient/:userId", authenticate, getPatientOldDataService);

// Report Generation Endpoints
oldData.post("/generate-work-comp-report", authenticate, generateOldWorkCompReportService);
oldData.post("/generate-tooth-work-report", authenticate, generateOldToothWorkReportService);
oldData.post("/generate-transactions-report", authenticate, generateOldTransactionReportService);
oldData.post("/generate-work-fees-report", authenticate, generateOldWorkFeeReportService);

export default oldData;

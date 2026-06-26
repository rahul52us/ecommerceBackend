import express from "express";
import authenticate from "../../modules/config/authenticate";
import {
  getOldWorkCompService,
  getOldToothWorkService,
  getOldTransactionService,
  getOldWorkFeeService,
  getLegacyRecordDetailsService,
  getLegacyPatientHistoryService
} from "../../services/oldData/oldData.service";

const oldData = express.Router();

oldData.get("/work-comp", authenticate, getOldWorkCompService);
oldData.get("/tooth-work", authenticate, getOldToothWorkService);
oldData.get("/transactions", authenticate, getOldTransactionService);
oldData.get("/work-fees", authenticate, getOldWorkFeeService);
oldData.get("/legacy-record-details/:legacyWrkDoneId", authenticate, getLegacyRecordDetailsService);
oldData.get("/patient-history/:legacyPatCode", authenticate, getLegacyPatientHistoryService);

export default oldData;

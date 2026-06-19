import express from "express";
import authenticate from "../../modules/config/authenticate";
import {
  getOldWorkCompService,
  getOldToothWorkService,
  getOldTransactionService,
  getOldWorkFeeService,
} from "../../services/oldData/oldData.service";

const oldData = express.Router();

oldData.get("/work-comp", authenticate, getOldWorkCompService);
oldData.get("/tooth-work", authenticate, getOldToothWorkService);
oldData.get("/transactions", authenticate, getOldTransactionService);
oldData.get("/work-fees", authenticate, getOldWorkFeeService);

export default oldData;

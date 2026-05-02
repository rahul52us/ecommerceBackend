import express from "express";
import authenticate from "../../modules/config/authenticate";
import {
  createWorkDoneService,
  getWorkDoneService,
  deleteWorkDoneService,
  updateWorkDoneService,
  getPatientFinancialStatsService,
  getDoctorFinancialStatsService,
} from "../../services/workDone/workDone.service";

const workDone = express.Router();

workDone.post("/create", authenticate, createWorkDoneService);
workDone.get("/get", authenticate, getWorkDoneService);
workDone.get("/stats", authenticate, getPatientFinancialStatsService);
workDone.get("/doctor-stats", authenticate, getDoctorFinancialStatsService);
workDone.put("/:id", authenticate, updateWorkDoneService);
workDone.delete("/:id", authenticate, deleteWorkDoneService);

export default workDone;

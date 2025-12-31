import express from "express";
import authenticate from "../../modules/config/authenticate";
import { downloadReportService } from "../../services/report/report.service";

const reportRouting = express.Router();
reportRouting.post("/download", authenticate, downloadReportService);
export default reportRouting;
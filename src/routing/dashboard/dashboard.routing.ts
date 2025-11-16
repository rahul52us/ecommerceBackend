import express from "express";
import authenticate from "../../modules/config/authenticate";
import { getDashboardData, getPatientDashboardCount } from "../../services/dashboard/dashboard.service";

const dashboardRouting = express.Router();
dashboardRouting.get(`/counts`, authenticate, getDashboardData);
dashboardRouting.post('/getPatientDashboardCount',authenticate,getPatientDashboardCount)
export default dashboardRouting;
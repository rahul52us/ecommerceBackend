import express from "express";
import authenticate from "../../modules/config/authenticate";
import { getDashboardData, getPatientDashboardCount, getTimeSlotAnalytics } from "../../services/dashboard/dashboard.service";

const dashboardRouting = express.Router();
dashboardRouting.get(`/counts`, authenticate, getDashboardData);
dashboardRouting.post('/getPatientDashboardCount',authenticate,getPatientDashboardCount)
dashboardRouting.get('/timeslot-analytics', authenticate, getTimeSlotAnalytics);
export default dashboardRouting;
import express from "express";
import authenticate from "../../modules/config/authenticate";
import { getDashboardData } from "../../services/dashboard/dashboard.service";

const dashboardRouting = express.Router();
dashboardRouting.get(`/counts`, authenticate, getDashboardData);
export default dashboardRouting;
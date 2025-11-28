import express from "express";
import authenticate from "../../modules/config/authenticate";
import { createChairsService, getChairsService } from "../../services/chairs/chairs.service";

const chairsRouting = express.Router();
chairsRouting.post("/create", authenticate, createChairsService);
chairsRouting.get("/get", authenticate, getChairsService);


export default chairsRouting;
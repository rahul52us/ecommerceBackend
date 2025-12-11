import express from "express";
import authenticate from "../../modules/config/authenticate";
import { createChairsService, deleteChairService, getChairsService, getChairSummaryService, updateChairService } from "../../services/chairs/chairs.service";

const chairsRouting = express.Router();
chairsRouting.post("/create", authenticate, createChairsService);
chairsRouting.get("/get", authenticate, getChairsService);
chairsRouting.delete("/delete/:id", authenticate,deleteChairService);
chairsRouting.put("/update/:id", authenticate,updateChairService);
chairsRouting.post('/getChairSummary',getChairSummaryService)

export default chairsRouting;
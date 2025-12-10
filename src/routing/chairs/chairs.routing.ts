import express from "express";
import authenticate from "../../modules/config/authenticate";
import { createChairsService, deleteChairService, getChairsService, updateChairService } from "../../services/chairs/chairs.service";

const chairsRouting = express.Router();
chairsRouting.post("/create", authenticate, createChairsService);
chairsRouting.get("/get", authenticate, getChairsService);

chairsRouting.delete("/delete/:id", authenticate,deleteChairService);
chairsRouting.put("/update/:id", authenticate,updateChairService);



export default chairsRouting;
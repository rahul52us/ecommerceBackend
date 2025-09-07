import express from "express";
import authenticate from "../../modules/config/authenticate";
import { createLabItemservice, createLabService, deleteLabItem, deleteLabService, getLabItems, getLabServices, getPatientLabItems, updateLabService, updateLineItems } from "../../services/lab/lab.service";

const labRouting = express.Router();
labRouting.post("/create", authenticate, createLabService);
labRouting.put("/:id", authenticate, updateLabService);
labRouting.post('/item/create',authenticate,createLabItemservice)
labRouting.post("/get", authenticate, getLabServices);
labRouting.post("/items/patient/get", authenticate, getPatientLabItems);
labRouting.post("/items/get", authenticate, getLabItems);
labRouting.put('/item/:id',authenticate,updateLineItems)
labRouting.delete('/:id',authenticate,deleteLabService)
labRouting.delete('/item/:id',authenticate,deleteLabItem)

export default labRouting;
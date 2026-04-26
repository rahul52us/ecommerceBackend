import express from "express";
import authenticate from "../../modules/config/authenticate";
import {
  createLabWorkStatus,
  getLabWorkStatuses,
  updateLabWorkStatus,
  deleteLabWorkStatus,
} from "../../services/labWork/labWorkStatus.service";

const labWorkStatusRouting = express.Router();

labWorkStatusRouting.post("/", authenticate, createLabWorkStatus);
labWorkStatusRouting.get("/", authenticate, getLabWorkStatuses);
labWorkStatusRouting.put("/:id", authenticate, updateLabWorkStatus);
labWorkStatusRouting.delete("/:id", authenticate, deleteLabWorkStatus);

export default labWorkStatusRouting;

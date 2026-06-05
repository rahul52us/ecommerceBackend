import express from "express";
import {
  createDoctorInventoryService,
  deleteDoctorInventoryService,
  getDoctorInventoriesService,
  updateDoctorInventoryService,
} from "../../services/doctorInventory/doctorInventory.service";
import authenticate from "../../modules/config/authenticate";

const router = express.Router();

router.post("/create", authenticate, createDoctorInventoryService);
router.put("/update/:id", authenticate, updateDoctorInventoryService);
router.delete("/delete/:id", authenticate, deleteDoctorInventoryService);
router.get("/get", authenticate, getDoctorInventoriesService);

export default router;

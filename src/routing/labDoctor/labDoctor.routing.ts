import express from "express";
import authenticate from "../../modules/config/authenticate";
import {
  createLabDoctorService,
  deleteLabDoctorService,
  getLabDoctorsService,
  updateLabDoctorService,
} from "../../services/labDoctor/labDoctor.service";

const labDoctorRouting = express.Router();

labDoctorRouting.post("/create", authenticate, createLabDoctorService);
labDoctorRouting.put("/:id", authenticate, updateLabDoctorService);
labDoctorRouting.post("/get", authenticate, getLabDoctorsService);
labDoctorRouting.delete("/:id", authenticate, deleteLabDoctorService);

export default labDoctorRouting;

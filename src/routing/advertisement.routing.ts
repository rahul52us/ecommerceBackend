import express from "express";
import {
  createAdvertisementService,
  updateAdvertisementService,
  getAdvertisementsService,
  getActiveAdvertisementsService,
  deleteAdvertisementService
} from "../services/advertisement/advertisement.service";
import authenticate from "../modules/config/authenticate";

const router = express.Router();

router.post("/", authenticate, createAdvertisementService);
router.put("/:id", authenticate, updateAdvertisementService);
router.get("/", authenticate, getAdvertisementsService);
router.get("/active", authenticate, getActiveAdvertisementsService);
router.delete("/:id", authenticate, deleteAdvertisementService);

export default router;

import express from "express";
import * as PrescriptionService from "../../services/prescription/prescription.service";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const result = await PrescriptionService.createPrescription(req.body);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/get", async (req, res) => {
  try {
    const result = await PrescriptionService.getPrescriptions(req.query);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/update/:id", async (req, res) => {
  try {
    const result = await PrescriptionService.updatePrescription(req.params.id, req.body);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const result = await PrescriptionService.deletePrescription(req.params.id);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

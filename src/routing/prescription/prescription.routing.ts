import express from "express";
import * as PrescriptionService from "../../services/prescription/prescription.service";
import authenticate from "../../modules/config/authenticate";


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

router.post("/bulk-import", async (req, res) => {
  try {
    const { base64Data, companyId, userId } = req.body;
    if (!base64Data) {
      return res.status(400).json({ message: "No data provided" });
    }
    const result = await PrescriptionService.bulkImportPrescriptions(base64Data, companyId, userId);
    res.status(200).json({ 
      message: `Successfully imported ${result.length} prescriptions`,
      count: result.length 
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/suggestions", async (req, res) => {
  try {
    const { companyId } = req.query;
    const result = await PrescriptionService.getPrescriptionSuggestions(companyId as string);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/patient-daily", authenticate, async (req, res) => {
  try {
    const { patientId, date, prescriptions } = req.body;
    const company = req.body.company || req.query.company || (req as any).companyId;
    const result = await PrescriptionService.savePatientDailyPrescription({
      patient: patientId,
      date,
      prescriptions,
      company
    });
    res.status(200).json({ status: "success", data: result });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.get("/patient-daily", authenticate, async (req, res) => {
  try {
    const { patientId, date } = req.query;
    const result = await PrescriptionService.getPatientDailyPrescription({
      patientId,
      date
    });
    res.status(200).json({ status: "success", data: result });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;


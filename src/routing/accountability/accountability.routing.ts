import express from "express";
import * as accountabilityService from "../../services/accountability/accountability.service";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const result = await accountabilityService.createAccountability(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.get("/list", async (req, res) => {
  try {
    const result = await accountabilityService.getAccountabilityList(req.query);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.put("/update-payout/:id", async (req, res) => {
  try {
    const { status, note, doctorShareAmount, payoutAmount, paymentMethod } = req.body;
    const result = await accountabilityService.updatePayoutStatus(req.params.id, status, note, doctorShareAmount, payoutAmount, paymentMethod);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const result = await accountabilityService.deleteAccountability(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.get("/generate-payout-report", async (req, res) => {
  try {
    const result = await accountabilityService.generateAccountabilityReportService(req.query);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;

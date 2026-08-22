import express from "express";
import { transferAdvanceToWallet, getPatientWalletHistory, addManualCreditToWallet, deductManualCreditFromWallet } from "../../controller/wallet/wallet.controller";
import authenticate from "../../modules/config/authenticate";

const router = express.Router();

router.post("/transfer", authenticate, transferAdvanceToWallet);
router.post("/add-credit", authenticate, addManualCreditToWallet);
router.post("/deduct-credit", authenticate, deductManualCreditFromWallet);
router.get("/history/:patientId", authenticate, getPatientWalletHistory);

export default router;

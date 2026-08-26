import express from "express";
import paymentController from "../../controller/payment/payment.controller";
import authenticate from "../../modules/config/authenticate";

const router = express.Router();

router.post("/", authenticate, paymentController.createPayment);
router.get("/", authenticate, paymentController.getPayments);
router.put("/:id", authenticate, paymentController.updatePayment);
router.delete("/:id", authenticate, paymentController.deletePayment);
router.delete("/secure/:id", authenticate, paymentController.secureDeletePayment);

export default router;

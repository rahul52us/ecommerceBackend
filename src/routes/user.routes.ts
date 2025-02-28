import express from "express";
import { createAdminUser, verifySignUpUser } from "../services/User/User";

const router = express.Router();

router.post("/admin/create", createAdminUser);
router.post("/verify", verifySignUpUser);

export default router;
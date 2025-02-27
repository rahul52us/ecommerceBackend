import express from "express";
import { createUser, verifyUser } from "../services/User/User";

const router = express.Router();

router.post("/create", createUser);
router.post("/verify", verifyUser);

export default router;
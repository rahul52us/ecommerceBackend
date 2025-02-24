import express from "express";
import { createUser } from "../modules/User/User";

const router = express.Router();

router.post("/create", createUser);

export default router;
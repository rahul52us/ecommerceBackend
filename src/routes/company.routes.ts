import express from "express";
import { updateCompanyService } from "../services/company/Company";
import authenticate from "../config/middleware/authenticate";

const router = express.Router();

router.put("/", authenticate, updateCompanyService);
export default router;

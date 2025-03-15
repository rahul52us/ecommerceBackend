import express from "express";
import { getCompanyService, updateCompanyService } from "../services/company/Company";
import authenticate from "../config/middleware/authenticate";

const router = express.Router();

router.put("/", authenticate, updateCompanyService);
router.post('/',getCompanyService)
export default router;

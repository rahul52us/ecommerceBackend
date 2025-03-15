import express from "express";
import { getCompanyService, getShopByTitleService, updateCompanyService } from "../services/company/Company";
import authenticate from "../config/middleware/authenticate";

const router = express.Router();

router.put("/", authenticate, updateCompanyService);
router.post('/',getCompanyService)
router.get('/:title',getShopByTitleService)

export default router;

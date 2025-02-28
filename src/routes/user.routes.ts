import express from "express";
import { createAdminUser, loginUser, verifyLoginUser, verifySignUpUser } from "../services/User/User";

const router = express.Router();

router.post("/admin/signup", createAdminUser);
router.post("/admin/signup/verify", verifySignUpUser);
router.post("/admin/login", loginUser);
router.post("/admin/login/verify", verifyLoginUser);

export default router;
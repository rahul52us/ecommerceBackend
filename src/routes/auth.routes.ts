import express from "express";
import {
  createAdminUser,
  getUserDetailsByIdService,
  loginUser,
  verifyLoginUser,
  verifySignUpUser,
} from "../services/User/User";
import authenticate from "../config/middleware/authenticate";

const router = express.Router();

router.post("/admin/signup", createAdminUser);
router.post("/admin/signup/verify", verifySignUpUser);
router.post("/login", loginUser);
router.post("/login/verify", verifyLoginUser);
router.get("/me", authenticate, getUserDetailsByIdService);

export default router;

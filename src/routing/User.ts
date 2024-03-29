import express from "express";
import { MeUser, createUser,forgotPassword, resetPassword, VerifyEmailToken, getUsersByCompany, updateUserProfile } from "../modules/User/User";
import authenticate from "../modules/config/authenticate";
import { loginUserService,changePasswordService, forgotPasswordService } from "../services/auth/auth.service";
const router = express.Router();

router.post("/create", createUser);
router.post('/login', loginUserService)
router.post('/me',authenticate,MeUser)
router.post('/forgot-password',forgotPasswordService)
router.put('/',authenticate,updateUserProfile)
router.post('/reset-password',resetPassword)
router.post('/change-password',authenticate,changePasswordService)
router.get('/verify-email/:token',VerifyEmailToken)
router.get('/get/users',authenticate,getUsersByCompany)

export default router;
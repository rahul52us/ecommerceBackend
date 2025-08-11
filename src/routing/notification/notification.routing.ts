import { getNotification, markNotificationAsRead } from "../../services/notification/notification.service";
import authenticate from "../../modules/config/authenticate";
import express from 'express'

const router = express.Router()
router.get('/',authenticate,getNotification)
router.put('/',authenticate,markNotificationAsRead)
export default router;
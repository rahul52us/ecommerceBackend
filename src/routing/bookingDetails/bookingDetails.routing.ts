import express from 'express'
import { createBookingDetailService, getBookingService } from "../../services/bookingDetails/bookingDetials.service";
import authenticate from '../../modules/config/authenticate';

const bookingRouting = express.Router()
bookingRouting.post('/create',createBookingDetailService)
bookingRouting.get(`/get`,authenticate,getBookingService)
export default bookingRouting;
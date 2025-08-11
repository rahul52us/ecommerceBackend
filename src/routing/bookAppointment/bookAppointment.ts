import express from 'express'
import authenticate from '../../modules/config/authenticate';
import { createBookAppointmentService, getBookAppointService } from '../../services/bookAppointment/bookingDetials.service';

const bookAppointmentRouting = express.Router()
bookAppointmentRouting.post('/create',createBookAppointmentService)
bookAppointmentRouting.get(`/get`,authenticate,getBookAppointService)
export default bookAppointmentRouting;
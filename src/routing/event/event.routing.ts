import authenticate from "../../modules/config/authenticate";
import { createEvent, deleteEvent, getEvent, updateEvent } from "../../modules/Event/Event.repository";
import express from 'express'

const router = express.Router()
router.post('/create',authenticate,createEvent)
router.put('/:id',authenticate,updateEvent)
router.get(`/get`,getEvent)
router.delete('/:id',authenticate,deleteEvent)
export default router;
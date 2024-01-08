import express from "express";
import { CalendarController } from '../controllers/main.calender.controller.js'
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

const calendarController = new CalendarController();

router.get("/diary/calendar/:year/:month", authMiddleware, calendarController.getCalendar)

export default router;
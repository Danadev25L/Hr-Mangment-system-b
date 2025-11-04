import express from 'express';
import { withAnyRole, withAdminOrManager } from '../../../withAuth.js';
import * as calendarController from '../controllers/calendar.controller.js';

const router = express.Router();

// Calendar routes
router.get('/', withAnyRole, calendarController.getCalendarEvents);
router.get('/today', withAnyRole, calendarController.getTodayEvents);
router.get('/holidays', withAnyRole, calendarController.getUpcomingHolidays);
router.get('/:id', withAnyRole, calendarController.getCalendarEvent);
router.post('/', withAdminOrManager, calendarController.createCalendarEvent);
router.put('/:id', withAdminOrManager, calendarController.updateCalendarEvent);
router.delete('/:id', withAdminOrManager, calendarController.deleteCalendarEvent);

export default router;

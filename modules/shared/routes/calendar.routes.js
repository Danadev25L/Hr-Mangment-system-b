import express from 'express';
import { withAnyRole, withRoleAdminOrManager } from '../../../withAuth.js';
import * as calendarController from '../controllers/calendar.controller.js';

const router = express.Router();

// Calendar routes
router.get('/', withAnyRole, calendarController.getCalendarEvents);
router.get('/today', withAnyRole, calendarController.getTodayEvents);
router.get('/holidays', withAnyRole, calendarController.getUpcomingHolidays);
router.get('/:id', withAnyRole, calendarController.getCalendarEvent);
router.post('/', withRoleAdminOrManager, calendarController.createCalendarEvent);
router.put('/:id', withRoleAdminOrManager, calendarController.updateCalendarEvent);
router.delete('/:id', withRoleAdminOrManager, calendarController.deleteCalendarEvent);

export default router;

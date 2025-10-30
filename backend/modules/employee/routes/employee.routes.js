import express from 'express';
import * as employeeProfileController from '../controllers/profile.employee.controller.js';
import * as employeePersonalInfoController from '../controllers/personalInfo.employee.controller.js';
import * as employeeApplicationController from '../controllers/application.employee.controller.js';
import * as employeeAnnouncementController from '../controllers/announcement.employee.controller.js';
import * as employeeHolidayController from '../controllers/holidays.employee.controller.js';

const router = express.Router();

// Employee Profile & Self-Service Routes
router.get('/profile', employeeProfileController.getMyProfile);
router.get('/salary-history', employeeProfileController.getMySalaryHistory);
router.get('/overtime', employeeProfileController.getMyOvertimeRecords);
router.post('/overtime/request', employeeProfileController.submitOvertimeRequest);
router.get('/notifications', employeeProfileController.getMyNotifications);
router.put('/notifications/:id/read', employeeProfileController.markNotificationAsRead);

// Employee Personal Information Routes (separated from profile)
router.get('/personal-info', employeePersonalInfoController.getMyPersonalInfo);
router.put('/personal-info', employeePersonalInfoController.updateMyPersonalInfo);
router.put('/password', employeePersonalInfoController.changeMyPassword);

// Employee Application Management Routes
router.post('/applications', employeeApplicationController.submitApplication);
router.get('/applications', employeeApplicationController.getMyApplications);
router.get('/applications/recent', employeeApplicationController.getMyRecentApplications);
router.get('/applications/stats', employeeApplicationController.getMyApplicationStats);
router.get('/applications/:id', employeeApplicationController.getMyApplication);
router.put('/applications/:id', employeeApplicationController.updateMyApplication);
router.delete('/applications/:id', employeeApplicationController.deleteMyApplication);

// Employee Announcement Routes
router.get('/announcements', employeeAnnouncementController.getMyAnnouncements);
router.get('/announcements/:id', employeeAnnouncementController.getAnnouncementById);
router.patch('/announcements/:id/read', employeeAnnouncementController.markAnnouncementAsRead);

// Employee Holiday Routes (View-Only)
router.get('/holidays', employeeHolidayController.getOrganizationHolidays);
router.get('/holidays/upcoming', employeeHolidayController.getUpcomingHolidays);
router.get('/holidays/month', employeeHolidayController.getHolidaysByMonth);
router.get('/holidays/today', employeeHolidayController.getTodayHolidayStatus);
router.get('/holidays/next', employeeHolidayController.getNextHoliday);
router.get('/holidays/:id', employeeHolidayController.getHoliday);

export default router;
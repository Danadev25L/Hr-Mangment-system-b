import express from 'express';
import * as managerEmployeeController from '../controllers/employee.manager.controller.js';
import * as managerAnnouncementController from '../controllers/announcement.manager.controller.js';
import * as managerJobController from '../controllers/job.manager.controller.js';
import * as managerExpenseController from '../controllers/expense.manager.controller.js';
import * as managerApplicationController from '../controllers/application.manager.controller.js';
import * as managerHolidayController from '../controllers/holidays.manager.controller.js';

const router = express.Router();

// Manager Employee Management Routes
router.get('/employees', managerEmployeeController.getMyDepartmentEmployees);
router.get('/payroll/:month/:year', managerEmployeeController.getDepartmentPayroll);
router.post('/employees/overtime', managerEmployeeController.addEmployeeOvertime);
router.put('/overtime/:id/approve', managerEmployeeController.approveOvertimeRequest);

// Manager Announcement Routes
router.post('/announcements', managerAnnouncementController.createAnnouncement);
router.get('/announcements', managerAnnouncementController.getDepartmentAnnouncements);
router.get('/announcements/:id', managerAnnouncementController.getAnnouncementById);
router.put('/announcements/:id', managerAnnouncementController.updateAnnouncement);
router.delete('/announcements/:id', managerAnnouncementController.deleteAnnouncement);

// Manager Job Management Routes
router.post('/jobs', managerJobController.createDepartmentJob);
router.get('/jobs', managerJobController.getDepartmentJobs);
router.get('/jobs/active', managerJobController.getActiveDepartmentJobs);
router.get('/jobs/employee/:userId', managerJobController.getDepartmentEmployeeJobs);
router.put('/jobs/:id', managerJobController.updateDepartmentJob);
router.delete('/jobs/:id', managerJobController.deleteDepartmentJob);

// Manager Expense Management Routes
router.post('/expenses', managerExpenseController.createDepartmentExpense);
router.get('/expenses', managerExpenseController.getDepartmentExpenses);
router.get('/expenses/year/:year', managerExpenseController.getDepartmentExpensesByYear);
router.get('/expenses/employee/:userId', managerExpenseController.getDepartmentEmployeeExpenses);
router.put('/expenses/:id/status', managerExpenseController.updateExpenseStatus);
router.put('/expenses/:id', managerExpenseController.updateDepartmentExpense);
router.delete('/expenses/:id', managerExpenseController.deleteDepartmentExpense);

// Manager Application Management Routes
router.get('/applications', managerApplicationController.getDepartmentApplications);
router.get('/applications/recent', managerApplicationController.getRecentDepartmentApplications);
router.get('/applications/employee/:userId', managerApplicationController.getDepartmentEmployeeApplications);
router.get('/applications/:id', managerApplicationController.getDepartmentApplication);
router.put('/applications/:id/approve', managerApplicationController.approveApplication);
router.put('/applications/:id/reject', managerApplicationController.rejectApplication);
router.put('/applications/:id', managerApplicationController.updateDepartmentApplication);

// Manager Holiday Management Routes (View-Only)
router.get('/holidays', managerHolidayController.getOrganizationHolidays);
router.get('/holidays/upcoming', managerHolidayController.getUpcomingHolidays);
router.get('/holidays/month', managerHolidayController.getHolidaysByMonth);
router.get('/holidays/statistics', managerHolidayController.getOrganizationHolidayStats);
router.get('/holidays/:id', managerHolidayController.getHoliday);
router.post('/holidays/suggest', managerHolidayController.suggestHoliday);

export default router;
import express from 'express';

import * as managerAnnouncementController from '../controllers/announcement.manager.controller.js';
import * as managerApplicationController from '../controllers/application.manager.controller.js';
import * as managerEmployeeController from '../controllers/employee.manager.controller.js';
import * as managerExpenseController from '../controllers/expense.manager.controller.js';
import * as managerHolidayController from '../controllers/holidays.manager.controller.js';
import * as managerJobController from '../controllers/job.manager.controller.js';
import * as managerAttendanceController from '../controllers/attendance.manager.controller.js';
import * as managerSalaryController from '../controllers/salary.manager.controller.js';

const router = express.Router();

// Manager Employee Management Routes
router.post('/employees', managerEmployeeController.createDepartmentEmployee);
router.get('/employees', managerEmployeeController.getMyDepartmentEmployees);
router.get('/employees/for-applications', managerEmployeeController.getDepartmentUsersForApplications);
router.get('/employees/:id', managerEmployeeController.getDepartmentEmployeeById);
router.put('/employees/:id', managerEmployeeController.updateDepartmentEmployee);
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
// Note: Managers can create, view, update, and delete expenses for their department
// But ONLY ADMIN can approve/reject/pay expenses (no status update route for managers)
router.post('/expenses', managerExpenseController.createDepartmentExpense);
router.get('/expenses/:id', managerExpenseController.getExpenseById);
router.get('/expenses', managerExpenseController.getDepartmentExpenses);
router.get('/expenses/year/:year', managerExpenseController.getDepartmentExpensesByYear);
router.get('/expenses/employee/:userId', managerExpenseController.getDepartmentEmployeeExpenses);
router.put('/expenses/:id', managerExpenseController.updateDepartmentExpense);
router.delete('/expenses/:id', managerExpenseController.deleteDepartmentExpense);

// Manager Application Management Routes
router.post('/applications', managerApplicationController.createDepartmentApplication);
router.get('/applications', managerApplicationController.getDepartmentApplications);
router.get('/applications/recent', managerApplicationController.getRecentDepartmentApplications);
router.get('/applications/employee/:userId', managerApplicationController.getDepartmentEmployeeApplications);
router.get('/applications/:id', managerApplicationController.getDepartmentApplication);
router.put('/applications/:id/approve', managerApplicationController.approveApplication);
router.put('/applications/:id/reject', managerApplicationController.rejectApplication);
router.put('/applications/:id', managerApplicationController.updateDepartmentApplication);
router.delete('/applications/:id', managerApplicationController.deleteDepartmentApplication);

// Manager Holiday Management Routes (View-Only)
router.get('/holidays', managerHolidayController.getOrganizationHolidays);
router.get('/holidays/upcoming', managerHolidayController.getUpcomingHolidays);
router.get('/holidays/month', managerHolidayController.getHolidaysByMonth);
router.get('/holidays/statistics', managerHolidayController.getOrganizationHolidayStats);
router.get('/holidays/:id', managerHolidayController.getHoliday);
router.post('/holidays/suggest', managerHolidayController.suggestHoliday);

// Manager Attendance Routes (VIEW-ONLY)
// Managers can only view team attendance - all actions handled by admin
router.get('/attendance/team', managerAttendanceController.getTeamAttendance);
router.get('/attendance/team/today', managerAttendanceController.getTodayTeamAttendance);
router.get('/attendance/team/summary', managerAttendanceController.getTeamAttendanceSummary);
router.get('/attendance/corrections/pending', managerAttendanceController.getPendingCorrections);

// Manager Salary Management Routes (View-Only for Department)
router.get('/salary-management/department', managerSalaryController.getDepartmentSalaries);
router.get('/salary-management/employee/:employeeId', managerSalaryController.getEmployeeSalaryDetails);
router.post('/salary-management/bonus', managerSalaryController.addBonus);
router.post('/salary-management/deduction', managerSalaryController.addDeduction);
router.post('/salary-management/overtime', managerSalaryController.addOvertime);
router.get('/salary-management/adjustments/employee/:employeeId', managerSalaryController.getEmployeeAdjustments);
router.put('/salary-management/adjustments/:adjustmentId', managerSalaryController.updateAdjustment);
router.delete('/salary-management/adjustments/:adjustmentId', managerSalaryController.deleteAdjustment);

export default router;
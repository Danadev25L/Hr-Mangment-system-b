import express from 'express';
import * as adminUserController from '../controllers/user.admin.controller.js';
import * as adminPayrollController from '../controllers/payroll.admin.controller.js';
import * as adminPaymentController from '../controllers/payment.admin.controller.js';
import * as adminDepartmentController from '../controllers/department.admin.controller.js';
import * as adminOrganizationController from '../controllers/organization.admin.controller.js';
import * as adminSalaryController from '../controllers/salary.admin.controller.js';
import * as adminApplicationController from '../controllers/application.admin.controller.js';
import * as adminAnnouncementController from '../controllers/announcement.admin.controller.js';
import * as adminHolidayController from '../controllers/holidays.admin.controller.js';

const router = express.Router();

// Admin User Management Routes
router.post('/users', adminUserController.createUser);
router.get('/users', adminUserController.getAllUsers);
router.get('/users/total', adminUserController.getUserStatistics); // For dashboard total users
router.get('/users/statistics', adminUserController.getUserStatistics);
router.get('/users/department/:id', adminUserController.getUsersByDepartment);
router.get('/users/:id', adminUserController.getUserById);
router.put('/users/:id', adminUserController.updateUser);
router.delete('/users/:id', adminUserController.deleteUser);
router.delete('/users/department/:id', adminUserController.deleteUsersByDepartment);

// Admin Payroll Management Routes
router.post('/payroll/generate', adminPayrollController.generateMonthlyPayroll);
router.get('/payroll/summary', adminPayrollController.getPayrollSummary);
router.put('/payroll/:id/approve', adminPayrollController.approvePayroll);
router.put('/payroll/:id/paid', adminPayrollController.markAsPaid);

// Admin Payment Management Routes
router.post('/payments', adminPaymentController.createPayment);
router.get('/payments', adminPaymentController.getAllPayments);
router.get('/payments/year/:year', adminPaymentController.getPaymentAnalyticsByYear); // For dashboard year data
router.get('/payments/analytics/:year', adminPaymentController.getPaymentAnalyticsByYear);
router.get('/payments/:id', adminPaymentController.getPaymentById);
router.get('/payments/user/:userId', adminPaymentController.getPaymentsByUser);
router.put('/payments/:id', adminPaymentController.updatePayment);
router.delete('/payments/:id', adminPaymentController.deletePayment);
router.delete('/payments/user/:userId', adminPaymentController.deletePaymentsByUser);

// Admin Department Management Routes
router.post('/departments', adminDepartmentController.createDepartment);
router.get('/departments', adminDepartmentController.getAllDepartments);
router.get('/departments/statistics', adminDepartmentController.getDepartmentStatistics);
router.get('/departments/:id', adminDepartmentController.getDepartmentById);
router.put('/departments/:id', adminDepartmentController.updateDepartment);
router.delete('/departments/:id', adminDepartmentController.deleteDepartment);

// Admin Organization Management Routes
router.post('/organizations', adminOrganizationController.createOrganization);
router.get('/organizations', adminOrganizationController.getAllOrganizations);
router.get('/organizations/:id', adminOrganizationController.getOrganization);
router.put('/organizations/:id', adminOrganizationController.updateOrganization);
router.delete('/organizations/:id', adminOrganizationController.deleteOrganization);
router.delete('/organizations', adminOrganizationController.deleteAllOrganizations);
router.get('/organizations/:id/stats', adminOrganizationController.getOrganizationStats);

// Admin Salary Management Routes
router.post('/salary/generate', adminSalaryController.generateMonthlySalary);
router.get('/salary/records', adminSalaryController.getAllSalaryRecords);
router.get('/salary/analytics', adminSalaryController.getSalaryAnalytics);
router.get('/salary/employee/:id', adminSalaryController.getEmployeeSalaryInfo);
router.post('/salary/bonus', adminSalaryController.addEmployeeBonus);
router.post('/salary/adjustment', adminSalaryController.addSalaryAdjustment);
router.put('/salary/base-salary', adminSalaryController.updateEmployeeBaseSalary);
router.post('/salary/overtime', adminSalaryController.addEmployeeOvertime);
router.get('/salary/overtime', adminSalaryController.getAllOvertimeRecords);

// Admin Employee Personal Information Management Routes
router.post('/personal-info', adminUserController.createEmployeePersonalInfo);
router.put('/personal-info/:userId', adminUserController.updateEmployeePersonalInfo);

// Admin Job Management Routes
router.post('/jobs', adminUserController.createEmployeeJob);
router.put('/jobs/:jobId', adminUserController.updateEmployeeJob);

// Admin Analytics and Dashboard Routes
router.get('/expenses/year/:year', adminUserController.getExpenseAnalyticsByYear);
router.get('/expenses', adminUserController.getAllExpenses);
router.post('/expenses', adminUserController.createExpense);
router.put('/expenses/:id', adminUserController.updateExpense);
router.put('/expenses/:id/status', adminUserController.updateExpenseStatus);
router.delete('/expenses/:id', adminUserController.deleteExpense);
router.get('/personalEvents/user/:userId', adminUserController.getPersonalEventsByUser);
router.get('/personalEvents/:id', adminUserController.getPersonalEvent);
router.post('/personalEvents', adminUserController.createPersonalEvent);
router.put('/personalEvents/:id', adminUserController.updatePersonalEvent);
router.delete('/personalEvents/:id', adminUserController.deletePersonalEvent);
router.get('/departmentAnnouncements/recent', adminUserController.getRecentDepartmentAnnouncements);

// Admin Announcement Management Routes
router.get('/announcements', adminAnnouncementController.getAllAnnouncements);
router.get('/announcements/:id', adminAnnouncementController.getAnnouncementById);
router.post('/announcements', adminAnnouncementController.createAnnouncement);
router.put('/announcements/:id', adminAnnouncementController.updateAnnouncement);
router.delete('/announcements/:id', adminAnnouncementController.deleteAnnouncement);
router.patch('/announcements/:id/toggle', adminAnnouncementController.toggleAnnouncementStatus);

// Admin Application Management Routes (Admin can see and manage ALL applications)
router.get('/applications', adminApplicationController.getAllApplications);
router.post('/applications', adminApplicationController.createApplication);
router.get('/applications/:id', adminApplicationController.getApplicationById);
router.put('/applications/:id', adminApplicationController.updateApplication);
router.delete('/applications/:id', adminApplicationController.deleteApplication);
router.put('/applications/:id/approve', adminApplicationController.approveApplication);
router.put('/applications/:id/reject', adminApplicationController.rejectApplication);

// Admin Holiday Management Routes
router.post('/holidays', adminHolidayController.createHoliday);
router.get('/holidays', adminHolidayController.getAllHolidays);
router.get('/holidays/upcoming', adminHolidayController.getUpcomingHolidays);
router.get('/holidays/statistics', adminHolidayController.getHolidayStatistics);
router.get('/holidays/organization/:organizationId', adminHolidayController.getOrganizationHolidays);
router.get('/holidays/:id', adminHolidayController.getHoliday);
router.put('/holidays/:id', adminHolidayController.updateHoliday);
router.delete('/holidays/:id', adminHolidayController.deleteHoliday);
router.delete('/holidays/organization/:organizationId', adminHolidayController.deleteOrganizationHolidays);

export default router;
import express from 'express';
import * as adminUserController from '../controllers/user.admin.controller.js';
import * as adminPayrollController from '../controllers/payroll.admin.controller.js';
import * as adminPaymentController from '../controllers/payment.admin.controller.js';
import * as adminDepartmentController from '../controllers/department.admin.controller.js';
import * as adminSalaryController from '../controllers/salary.admin.controller.js';
import * as salaryManagementController from '../controllers/salary.management.admin.controller.js';
import * as adminApplicationController from '../controllers/application.admin.controller.js';
import * as adminAnnouncementController from '../controllers/announcement.admin.controller.js';
import * as adminHolidayController from '../controllers/holidays.admin.controller.js';
import * as adminAttendanceController from '../controllers/attendance.admin.controller.js';
import * as advancedAttendanceController from '../controllers/attendance.advanced.admin.controller.js';
import * as autoAttendanceController from '../controllers/autoAttendance.admin.controller.js';

const router = express.Router();

// Admin User Management Routes
router.post('/users', adminUserController.createUser);
router.get('/users', adminUserController.getAllUsers);
router.get('/users/total', adminUserController.getUserStatistics); // For dashboard total users
router.get('/users/statistics', adminUserController.getUserStatistics);
router.get('/users/stats/new-this-month', adminUserController.getNewEmployeesThisMonth);
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


// Admin Salary Management Routes (Legacy)
router.post('/salary/generate', adminSalaryController.generateMonthlySalary);
router.get('/salary/records', adminSalaryController.getAllSalaryRecords);
router.get('/salary/analytics', adminSalaryController.getSalaryAnalytics);
router.get('/salary/employee/:id', adminSalaryController.getEmployeeSalaryInfo);
router.post('/salary/bonus', adminSalaryController.addEmployeeBonus);
router.post('/salary/adjustment', adminSalaryController.addSalaryAdjustment);
router.put('/salary/base-salary', adminSalaryController.updateEmployeeBaseSalary);
router.post('/salary/overtime', adminSalaryController.addEmployeeOvertime);
router.get('/salary/overtime', adminSalaryController.getAllOvertimeRecords);

// Comprehensive Salary Management Routes (New System)
router.get('/salary-management/config', salaryManagementController.getSalaryConfig);
router.put('/salary-management/config', salaryManagementController.updateSalaryConfig);
router.post('/salary-management/calculate', salaryManagementController.calculateMonthlySalaries);
router.get('/salary-management/monthly', salaryManagementController.getAllMonthlySalaries);
router.get('/salary-management/employee/:employeeId', salaryManagementController.getEmployeeSalaryDetails);
router.post('/salary-management/bonus', salaryManagementController.addBonus);
router.post('/salary-management/deduction', salaryManagementController.addDeduction);
router.post('/salary-management/overtime', salaryManagementController.addOvertime);
router.get('/salary-management/adjustments/employee/:employeeId', salaryManagementController.getEmployeeAdjustments);
router.put('/salary-management/adjustments/:adjustmentId', salaryManagementController.updateAdjustment);
router.delete('/salary-management/adjustments/:adjustmentId', salaryManagementController.deleteAdjustment);
router.put('/salary-management/:salaryId/approve', salaryManagementController.approveSalary);
router.put('/salary-management/:salaryId/paid', salaryManagementController.markAsPaid);
router.get('/salary-management/components', salaryManagementController.getAllComponents);
router.post('/salary-management/components/assign', salaryManagementController.assignComponentToEmployee);
router.get('/salary-management/components/employee/:employeeId', salaryManagementController.getEmployeeComponents);

// Admin Employee Personal Information Management Routes
router.post('/personal-info', adminUserController.createEmployeePersonalInfo);
router.put('/personal-info/:userId', adminUserController.updateEmployeePersonalInfo);

// Admin Job Management Routes
router.post('/jobs', adminUserController.createEmployeeJob);
router.put('/jobs/:jobId', adminUserController.updateEmployeeJob);

// Admin Analytics and Dashboard Routes
router.get('/expenses/year/:year', adminUserController.getExpenseAnalyticsByYear);
router.get('/expenses/:id', adminUserController.getExpenseById);
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
router.get('/holidays/:id', adminHolidayController.getHoliday);
router.put('/holidays/:id', adminHolidayController.updateHoliday);
router.delete('/holidays/:id', adminHolidayController.deleteHoliday);

// ==================== ADVANCED ATTENDANCE SYSTEM ====================

// Basic Attendance Management Routes - GET routes first
router.get('/attendance/summaries', adminAttendanceController.getAllAttendanceSummaries);
router.get('/attendance/corrections', adminAttendanceController.getAllCorrectionRequests);
router.get('/attendance', adminAttendanceController.getAllAttendance);

// Employee Selection & Viewing
router.get('/attendance/employees', advancedAttendanceController.getAllEmployeesWithAttendance);
router.get('/attendance/employee/:employeeId/details', advancedAttendanceController.getEmployeeAttendanceDetails);

// Reports & Export
router.get('/attendance/report', advancedAttendanceController.getAttendanceReport);
router.get('/attendance/export/csv', advancedAttendanceController.exportAttendanceCSV);
router.get('/attendance/check-leave', adminAttendanceController.checkEmployeeLeave);

// Auto-Attendance Management Routes
router.get('/auto-attendance/status', autoAttendanceController.getAutoAttendanceStatus);
router.post('/auto-attendance/trigger', autoAttendanceController.triggerAutoAttendanceManual);
router.post('/auto-attendance/trigger-range', autoAttendanceController.triggerAutoAttendanceRange);
router.post('/auto-attendance/backfill', autoAttendanceController.backfillMissingAttendance);

// POST routes - specific routes first
router.post('/attendance/checkin', advancedAttendanceController.markEmployeeCheckIn);
router.post('/attendance/checkout', advancedAttendanceController.markEmployeeCheckOut);
router.post('/attendance/mark-absent', advancedAttendanceController.markEmployeeAbsent);
router.post('/attendance/add-break', advancedAttendanceController.addBreakDuration);
router.post('/attendance/bulk-mark', advancedAttendanceController.bulkMarkAttendance);
router.post('/attendance/add-latency', adminAttendanceController.addLatency);
router.post('/attendance/add-early-departure', adminAttendanceController.addEarlyDeparture);
router.post('/attendance/add-partial-leave', adminAttendanceController.addPartialLeave);
router.post('/attendance/generate-summaries', adminAttendanceController.generateMonthlySummaries);
router.post('/attendance', adminAttendanceController.createManualAttendance);

// PUT routes - specific routes BEFORE :id route
router.put('/attendance/edit-checkin', advancedAttendanceController.editCheckInTime);
router.put('/attendance/edit-checkout', advancedAttendanceController.editCheckOutTime);
router.put('/attendance/edit-break', advancedAttendanceController.editBreakDuration);
router.put('/attendance/add-overtime', advancedAttendanceController.addOvertimeHours);
router.put('/attendance/update-record', advancedAttendanceController.updateAttendanceRecord);
router.put('/attendance/:id', adminAttendanceController.updateAttendance); // ⚠️ MUST BE LAST!

// DELETE routes - specific routes BEFORE :id route
router.delete('/attendance/delete-record', advancedAttendanceController.deleteAttendanceRecord);
router.delete('/attendance/:id', adminAttendanceController.deleteAttendance); // ⚠️ MUST BE LAST!

export default router;
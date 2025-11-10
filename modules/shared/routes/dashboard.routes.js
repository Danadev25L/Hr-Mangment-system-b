import express from 'express';
import { withAnyRole } from '../../../withAuth.js';
import * as dashboardController from '../controllers/dashboard.controller.js';

const router = express.Router();

// Dashboard routes - accessible to all authenticated users
// These routes are NOT under /api, so they don't need the /api prefix
router.get('/stats', withAnyRole, dashboardController.getDashboardStats);
router.get('/charts/user-growth', withAnyRole, dashboardController.getUserGrowthChart);
router.get('/charts/departments', withAnyRole, dashboardController.getDepartmentsChart);
router.get('/charts/attendance-trends', withAnyRole, dashboardController.getAttendanceTrends);
router.get('/charts/annual-attendance', withAnyRole, dashboardController.getAnnualAttendanceTrends);
router.get('/charts/expenses-by-category', withAnyRole, dashboardController.getExpensesByCategory);
router.get('/charts/applications-by-type', withAnyRole, dashboardController.getApplicationsByType);
router.get('/charts/salary-overview', withAnyRole, dashboardController.getSalaryOverview);
router.get('/quick-stats', withAnyRole, dashboardController.getQuickStats);
router.get('/performance-metrics', withAnyRole, dashboardController.getPerformanceMetrics);
router.get('/application-stats', withAnyRole, dashboardController.getRecentApplicationsStats);

export default router;
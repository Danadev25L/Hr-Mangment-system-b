import express from 'express';
import { withAnyRole } from '../../../withAuth.js';
import * as dashboardController from '../controllers/dashboard.controller.js';

const router = express.Router();

// Dashboard routes - accessible to all authenticated users
// These routes are NOT under /api, so they don't need the /api prefix
router.get('/stats', withAnyRole, dashboardController.getDashboardStats);
router.get('/charts/user-growth', withAnyRole, dashboardController.getUserGrowthChart);
router.get('/charts/departments', withAnyRole, dashboardController.getDepartmentsChart);

export default router;
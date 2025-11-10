import express from 'express';
import { withRoleAdmin, withRoleManager, withRoleEmployee, withAnyRole } from '../withAuth.js';
import adminRoutes from './admin/routes/admin.routes.js';
import managerRoutes from './manager/routes/manager.routes.js';
import employeeRoutes from './employee/routes/employee.routes.js';
import sharedRoutes from './shared/routes/shared.routes.js';

const router = express.Router();

// Role-based routing middleware that extracts user data from existing auth
const extractUserData = (req, res, next) => {
    // The user data is already set by withAuth middleware in req.headers.user
    if (req.headers.user) {
        const userData = JSON.parse(req.headers.user);
        req.user = userData; // Add user data to req.user for easier access
    }
    next();
};

// Mount role-specific routes with proper middleware chain
// Admin routes: /api/admin/*
router.use('/admin', withRoleAdmin, extractUserData, adminRoutes);

// Manager routes: /api/manager/*  
router.use('/manager', withRoleManager, extractUserData, managerRoutes);

// Employee routes: /api/employee/*
router.use('/employee', withRoleEmployee, extractUserData, employeeRoutes);

// Shared routes: /api/shared/* (available to all authenticated users)
router.use('/shared', withAnyRole, extractUserData, sharedRoutes);

export default router;
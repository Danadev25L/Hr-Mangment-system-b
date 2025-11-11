import { eq, and, gte, lt } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { payments, users } from '../../../db/schema.js';

// Admin: Create new payment record
export const createPayment = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({
                message: "Content cannot be empty!"
            });
        }

        const newPayment = {
            userId: req.body.userId,
            amount: req.body.paymentAmount || req.body.amount,
            type: req.body.type || 'payment',
            date: req.body.paymentDate || req.body.date,
            description: req.body.comments || req.body.description
        };

        const result = await db.insert(payments)
            .values(newPayment)
            .returning();
        
        res.json(result[0]);
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while creating payment."
        });
    }
};

// Admin: Get all payments system-wide
export const getAllPayments = async (req, res) => {
    try {
        const result = await db.select({
            id: payments.id,
            amount: payments.amount,
            date: payments.date,
            description: payments.description,
            userId: payments.userId,
            type: payments.type,
            user: {
                id: users.id,
                fullName: users.fullName,
                username: users.username
            }
        })
        .from(payments)
        .leftJoin(users, eq(payments.userId, users.id))
        .orderBy(payments.date);
        
        res.json(result);
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while retrieving payments."
        });
    }
};

// Admin: Get payment analytics by year
export const getPaymentAnalyticsByYear = async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year + 1, 0, 1);
        
        const result = await db.select()
            .from(payments)
            .where(and(
                gte(payments.date, startDate),
                lt(payments.date, endDate)
            ))
            .orderBy(payments.date);
        
        const monthlyTotals = {};
        const monthNames = ["January", "February", "March", "April", "May", "June", 
                           "July", "August", "September", "October", "November", "December"];
        
        monthNames.forEach(month => {
            monthlyTotals[month] = 0;
        });
        
        result.forEach(payment => {
            const monthIndex = new Date(payment.date).getMonth();
            const monthName = monthNames[monthIndex];
            monthlyTotals[monthName] += parseFloat(payment.amount) || 0;
        });
        
        const formattedResult = monthNames.map(month => ({
            month: month,
            expenses: monthlyTotals[month].toString()
        }));
        
        res.json(formattedResult);
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while retrieving payment analytics."
        });
    }
};

// Admin: Get payment details
export const getPaymentById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        const result = await db.select({
            id: payments.id,
            amount: payments.amount,
            date: payments.date,
            description: payments.description,
            userId: payments.userId,
            type: payments.type,
            user: {
                id: users.id,
                fullName: users.fullName,
                username: users.username
            }
        })
        .from(payments)
        .leftJoin(users, eq(payments.userId, users.id))
        .where(eq(payments.id, id));
        
        if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({
                message: `Payment with id=${id} not found.`
            });
        }
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving payment with id=" + req.params.id
        });
    }
};

// Admin: Get all payments for specific user
export const getPaymentsByUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        const result = await db.select({
            id: payments.id,
            amount: payments.amount,
            date: payments.date,
            description: payments.description,
            userId: payments.userId,
            type: payments.type,
            user: {
                id: users.id,
                fullName: users.fullName,
                username: users.username
            }
        })
        .from(payments)
        .leftJoin(users, eq(payments.userId, users.id))
        .where(eq(payments.userId, userId));
        
        res.json(result);
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while retrieving payments by user."
        });
    }
};

// Admin: Update payment
export const updatePayment = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        const updateData = {
            userId: req.body.userId,
            amount: req.body.paymentAmount || req.body.amount,
            type: req.body.type,
            date: req.body.paymentDate || req.body.date,
            description: req.body.comments || req.body.description
        };
        
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });
        
        const result = await db.update(payments)
            .set(updateData)
            .where(eq(payments.id, id))
            .returning();
        
        if (result.length > 0) {
            res.json({
                message: "Payment updated successfully.",
                data: result[0]
            });
        } else {
            res.status(404).json({
                message: `Cannot update payment with id=${id}. Payment not found!`
            });
        }
    } catch (error) {
        res.status(500).json({
            message: "Error updating payment with id=" + req.params.id
        });
    }
};

// Admin: Delete payment
export const deletePayment = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        const result = await db.delete(payments)
            .where(eq(payments.id, id))
            .returning();
        
        if (result.length > 0) {
            res.json({
                message: "Payment deleted successfully!"
            });
        } else {
            res.status(404).json({
                message: `Cannot delete payment with id=${id}. Payment not found!`
            });
        }
    } catch (error) {
        res.status(500).json({
            message: "Could not delete payment with id=" + req.params.id
        });
    }
};

// Admin: Delete all payments by user
export const deletePaymentsByUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        const result = await db.delete(payments)
            .where(eq(payments.userId, userId))
            .returning();
        
        res.json({ 
            message: `${result.length} payments deleted successfully!` 
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while removing payments by user."
        });
    }
};
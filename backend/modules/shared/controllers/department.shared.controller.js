import { db } from '../../../db/index.js';
import { departments } from '../../../db/schema.js';

// Get all departments (available to all authenticated users for reference)
export const getAllDepartments = async (req, res) => {
  try {
    const allDepartments = await db.select({
      id: departments.id,
      departmentName: departments.departmentName,
      name: departments.departmentName, // Alias for compatibility
      isActive: departments.isActive,
      createdAt: departments.createdAt,
      updatedAt: departments.updatedAt,
    })
    .from(departments);

    res.json(allDepartments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      message: 'Error retrieving departments'
    });
  }
};

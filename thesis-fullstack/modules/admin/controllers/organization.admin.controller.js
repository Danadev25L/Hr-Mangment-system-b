import { eq } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { organizations, departments } from '../../../db/schema.js';

/**
 * Admin Organization Controller
 * Handles system-wide organization management for administrators
 */

// Create and Save a new Organization
export const createOrganization = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: "Content can not be empty!"
      });
    }

    // Check if organization already exists
    const existingOrg = await db.select()
      .from(organizations)
      .where(eq(organizations.organizationName, req.body.organizationName))
      .limit(1);

    if (existingOrg.length > 0) {
      return res.status(401).json({
        message: "Organization Name already exists"
      });
    }

    // Create an Organization
    const [organization] = await db.insert(organizations)
      .values({
        organizationName: req.body.organizationName,
        emailAddress: req.body.emailAddress,
        city: req.body.city,
        country: req.body.country,
        isActive: true
      })
      .returning();

    res.json({
      message: "Organization created successfully",
      organization
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while creating the Organization."
    });
  }
};

// Retrieve all Organizations from the database
export const getAllOrganizations = async (req, res) => {
  try {
    const allOrgs = await db.query.organizations.findMany({
      with: {
        departments: true
      }
    });

    res.json({ 
      data: allOrgs, 
      authData: req.authData 
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving organizations."
    });
  }
};

// Find a single Organization with an id
export const getOrganization = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, id),
      with: {
        departments: true
      }
    });

    if (!organization) {
      return res.status(404).json({
        message: `Organization with id ${id} not found`
      });
    }

    res.json({
      data: organization,
      authData: req.authData
    });
  } catch (error) {
    res.status(500).json({
      message: `Error retrieving Organization with id=${req.params.id}`
    });
  }
};

// Update an Organization by the id in the request
export const updateOrganization = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const [updatedOrg] = await db.update(organizations)
      .set({
        organizationName: req.body.organizationName,
        emailAddress: req.body.emailAddress,
        city: req.body.city,
        country: req.body.country,
        updatedAt: new Date()
      })
      .where(eq(organizations.id, id))
      .returning();

    if (!updatedOrg) {
      return res.status(404).json({
        message: `Cannot update Organization with id=${id}. Organization was not found!`
      });
    }

    res.json({
      message: "Organization was updated successfully.",
      organization: updatedOrg
    });
  } catch (error) {
    res.status(500).json({
      message: `Error updating Organization with id=${req.params.id}`
    });
  }
};

// Delete an Organization with the specified id in the request
export const deleteOrganization = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // First, delete associated departments
    await db.delete(departments)
      .where(eq(departments.organizationId, id));

    // Then delete the organization
    const [deletedOrg] = await db.delete(organizations)
      .where(eq(organizations.id, id))
      .returning();

    if (!deletedOrg) {
      return res.status(404).json({
        message: `Cannot delete Organization with id=${id}. Organization was not found!`
      });
    }

    res.json({
      message: "Organization was deleted successfully!"
    });
  } catch (error) {
    res.status(500).json({
      message: `Could not delete Organization with id=${req.params.id}`
    });
  }
};

// Delete all Organizations from the database
export const deleteAllOrganizations = async (req, res) => {
  try {
    // First, delete all departments
    await db.delete(departments);

    // Then delete all organizations
    const result = await db.delete(organizations).returning();

    res.json({
      message: `${result.length} Organizations were deleted successfully!`
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while removing all Organizations."
    });
  }
};

// Get organization statistics
export const getOrganizationStats = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, id),
      with: {
        departments: {
          with: {
            users: true
          }
        }
      }
    });

    if (!organization) {
      return res.status(404).json({
        message: `Organization with id ${id} not found`
      });
    }

    const stats = {
      organizationId: organization.id,
      organizationName: organization.organizationName,
      totalDepartments: organization.departments.length,
      totalEmployees: organization.departments.reduce((sum, dept) => sum + dept.users.length, 0),
      departmentDetails: organization.departments.map(dept => ({
        id: dept.id,
        name: dept.departmentName,
        employeeCount: dept.users.length
      }))
    };

    res.json({
      message: "Organization statistics retrieved successfully",
      stats
    });
  } catch (error) {
    res.status(500).json({
      message: `Error retrieving organization statistics for id=${req.params.id}`
    });
  }
};
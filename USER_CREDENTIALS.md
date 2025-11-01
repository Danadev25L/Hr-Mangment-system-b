# HRS - User Credentials

This document contains the login credentials for all user accounts created in the system seed data.

## 🔐 Login Information

### Administrator Account
- **Username:** `admin`
- **Password:** Admin@2024!Secure
- **Employee Code:** `ADM-0001` (Auto-generated)
- **Role:** Admin
- **Full Name:** Admin User
- **Department:** Human Resources
- **Email:** admin@techsolutions.com

### Manager Account
- **Username:** `manager`
- **Password:** `Manager@2024!Strong`
- **Employee Code:** `MGR-0001` (Auto-generated)
- **Role:** Manager
- **Full Name:** Mike Johnson
- **Department:** Engineering
- **Email:** mike.johnson@techsolutions.com

### Employee Accounts

#### Employee 1
- **Username:** `john.doe`
- **Password:** `Employee@2024!John`
- **Employee Code:** `EMP-0001` (Auto-generated)
- **Role:** Employee
- **Full Name:** John Doe
- **Department:** Engineering
- **Job Title:** Software Engineer
- **Email:** john.doe@techsolutions.com

#### Employee 2
- **Username:** `jane.smith`
- **Password:** `Employee@2024!Jane`
- **Employee Code:** `EMP-0002` (Auto-generated)
- **Role:** Employee
- **Full Name:** Jane Smith
- **Department:** Finance
- **Job Title:** Accountant
- **Email:** jane.smith@techsolutions.com

---

## 🏢 Organization Structure

### Organizations
1. **Tech Solutions Inc.** (Primary)
   - Email: contact@techsolutions.com
   - Location: Athens, Greece

2. **Digital Innovations**
   - Email: info@digitalinnovations.com
   - Location: Thessaloniki, Greece

### Departments
1. **Human Resources** (Admin's department)
2. **Engineering** (Manager and John Doe's department)
3. **Finance** (Jane Smith's department)

### Job Positions & Salaries
- **HR Manager:** €45,000/year
- **Engineering Manager:** €65,000/year
- **Software Engineer:** €55,000/year
- **Accountant:** €40,000/year

---

## 🔒 Security Information

### Password Security Features
✅ All passwords meet security requirements:
- Minimum 8 characters
- Contains uppercase letters
- Contains lowercase letters
- Contains numbers
- Contains special characters
- Encrypted with bcrypt (10 rounds)

### ⚠️ Important Security Notes
1. **Change passwords after first login** - These are default credentials for development/testing
2. **Use strong, unique passwords** for production environments
3. **Enable two-factor authentication** if available
4. **Regular password rotation** is recommended

---

## 🚀 Quick Access

### Development Login URLs
- **Frontend:** http://localhost:3000/login
- **API Base URL:** http://localhost:3001/api

### Testing Scenarios

#### Admin Testing
- Full system access
- User management capabilities
- Department management
- System configuration
- Analytics and reporting

#### Manager Testing
- Team member management
- Expense approval
- Department announcements
- Payroll access for team members
- Working hours tracking

#### Employee Testing
- Personal profile management
- Expense submissions
- Holiday requests
- Announcement viewing
- Working time tracking

---

## 📱 Additional Information

### Personal Information Available
- Full names and contact details
- Addresses and locations
- Birth dates and demographics
- Employment history
- Salary information

### Sample Data Included
- Department announcements
- Expense reports (approved and pending)
- Payment records
- Holiday requests
- Working hours logs
- Internal messages
- Personal events

### Data Last Updated
- **Seed File:** `backend/db/seed.js`
- **Created:** October 2024
- **Environment:** Development/Testing

---

*🔐 Keep this document secure and do not share credentials publicly.*
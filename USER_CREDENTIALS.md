# 🔐 HR Management System - User Credentials

## Default Login Credentials

All passwords have been set with high security standards including uppercase, lowercase, numbers, and special characters.

### 👨‍💼 Admin Account
```
Username: admin
Password: Admin@2024!Secure
Role: Administrator
Email: admin@techsolutions.com
```

**Admin Capabilities:**
- Full system access
- Manage all employees
- Manage departments
- Manage payroll
- Manage attendance (including auto-attendance system)
- View all reports and analytics
- Manage applications and approvals
- System settings

---

### 👔 Manager Account
```
Username: manager
Password: Manager@2024!Strong
Role: Manager
Email: manager@techsolutions.com
```

**Manager Capabilities:**
- Manage team members
- Approve/reject leave applications
- View team attendance
- Manage team expenses
- View team reports
- Create announcements

---

### 👤 Employee Account 1
```
Username: john.doe
Password: Employee@2024!John
Role: Employee
Email: john.doe@techsolutions.com
Department: Engineering
```

**Employee Capabilities:**
- View own attendance
- Submit leave applications
- View payslips
- Submit expenses
- View announcements
- Update personal profile

---

### 👤 Employee Account 2
```
Username: jane.smith
Password: Employee@2024!Jane
Role: Employee
Email: jane.smith@techsolutions.com
Department: Human Resources
```

**Employee Capabilities:**
- View own attendance
- Submit leave applications
- View payslips
- Submit expenses
- View announcements
- Update personal profile

---

## 🔒 Password Security Features

All passwords are encrypted with:
- ✅ Bcrypt encryption (10 rounds)
- ✅ Minimum 8 characters
- ✅ Contains uppercase letters (A-Z)
- ✅ Contains lowercase letters (a-z)
- ✅ Contains numbers (0-9)
- ✅ Contains special characters (!@#$%)

---

## ⚠️ Important Security Notes

1. **CHANGE PASSWORDS IMMEDIATELY** after first login
2. Never share your credentials with anyone
3. Use strong, unique passwords
4. Enable two-factor authentication if available
5. Log out after each session

---

## 🚀 Auto-Attendance System

The system now includes an **automatic attendance** feature with **FULL BACKFILL** capability:

### Daily Auto-Marking
- **Runs Daily:** Every day at 1:00 AM
- **Auto-marks:** All employees as checked in and checked out on time
- **Perfect Attendance:** No lateness, no early departure, no breaks
- **Smart Skipping:** 
  - Weekends and holidays are skipped
  - Employees on approved leave are skipped
  - Existing attendance records are not overwritten
  - Only creates records for dates AFTER employee was created

### Historical Backfill (NEW!)
The system can backfill **ALL** missing attendance records throughout history:
- Goes back to each employee's **creation date**
- Fills in **every missing working day** automatically
- Skips weekends, holidays, and leave days
- Won't overwrite existing records
- Creates perfect on-time attendance for all past days

### Manual Trigger (Admin Only)
Admins can manually trigger auto-attendance via API:

**Daily Auto-Mark:**
- `POST /api/admin/auto-attendance/trigger` - For specific date
- `POST /api/admin/auto-attendance/trigger-range` - For date range

**Historical Backfill:**
- `POST /api/admin/auto-attendance/backfill` - Fill ALL missing historical records

**System Info:**
- `GET /api/admin/auto-attendance/status` - Check system status

### Example: Backfill Usage
```bash
# Fill all missing attendance from employee creation to yesterday
POST http://localhost:3001/api/admin/auto-attendance/backfill
```

This will process:
- All employees in the system
- All days from their employment start date to yesterday
- Only working days (skip weekends/holidays)
- Skip days when employee was on leave
- Skip days that already have attendance records

---

## 📱 Access URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

---

## 🆘 Troubleshooting

### Forgot Password?
Contact the system administrator to reset your password.

### Cannot Login?
1. Check if backend server is running (port 3001)
2. Check if frontend server is running (port 3000)
3. Verify credentials are correct (case-sensitive)
4. Clear browser cache and cookies
5. Try a different browser

### 401 Unauthorized Error?
You need to log in first to access the system features.

---

**Last Updated:** November 10, 2025
**System Version:** 2.0.0

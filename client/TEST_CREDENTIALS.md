# 🔑 Test Login Credentials

These are the test credentials for the HR System. All passwords are **secure** and encrypted with bcrypt.

## 👑 Admin Access
```
Username: admin
Password: Admin@2024!Secure
Role: ROLE_ADMIN
```
**Permissions:**
- ✅ Full system access
- ✅ Departments management (Create, Edit, Delete, View)
- ✅ Employee management
- ✅ System administration

---

## 👔 Manager Access  
```
Username: manager
Password: Manager@2024!Strong
Role: ROLE_MANAGER
```
**Permissions:**
- ✅ Team management
- ✅ Employee oversight
- ✅ Reports and analytics
- ❌ No departments management

---

## 👨‍💻 Employee Access #1
```
Username: john.doe
Password: Employee@2024!John
Role: ROLE_EMPLOYEE
Department: Engineering
```
**Permissions:**
- ✅ Personal dashboard
- ✅ View own information
- ✅ Submit requests
- ❌ No management access

---

## 👩‍💼 Employee Access #2
```
Username: jane.smith  
Password: Employee@2024!Jane
Role: ROLE_EMPLOYEE
Department: Finance
```
**Permissions:**
- ✅ Personal dashboard
- ✅ View own information
- ✅ Submit requests
- ❌ No management access

---

## 🛡️ Security Features
All passwords include:
- ✅ Minimum 8 characters
- ✅ Uppercase & lowercase letters
- ✅ Numbers & special characters
- ✅ Encrypted with bcrypt (10 rounds)

## 🧪 Testing Instructions

1. **Test Admin Features:**
   - Login as `admin` with password `Admin@2024!Secure`
   - Navigate to `/dashboard/admin`
   - Access Departments section (only visible to admin)

2. **Test Role-Based Access:**
   - Try accessing `/dashboard/admin` as manager or employee
   - Should redirect to appropriate role dashboard

3. **Test Authentication:**
   - Try accessing any dashboard without login
   - Should redirect to login page

---

⚠️ **IMPORTANT:** Change these passwords in production!
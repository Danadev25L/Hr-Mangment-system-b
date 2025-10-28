# 🔐 Admin-Only User Management Policy

## Overview

This document outlines the strict access control policy for user account management in the HRS (Human Resource System) application.

---

## 🚨 CRITICAL SECURITY POLICY

### ✅ **ONLY ADMINISTRATORS CAN CREATE, MODIFY, OR DELETE USER ACCOUNTS**

**No public registration is allowed.** Users cannot create their own accounts. All user account management is strictly controlled by verified administrators.

---

## 🛡️ Security Implementation

### 1. **No Public Registration Endpoint**
- ❌ There is NO `/auth/register` endpoint
- ❌ Users CANNOT self-register
- ❌ No public access to user creation

### 2. **Admin-Only User Creation**
**Endpoint:** `POST /api/admin/users`

**Security Checks Performed:**
1. ✅ JWT Token verification (via `verifyToken` middleware)
2. ✅ Role verification (via `withRoleAdmin` middleware)
3. ✅ Database verification of admin ID
4. ✅ Verification of `ROLE_ADMIN` role in database
5. ✅ Check that admin account is active
6. ✅ Password strength validation
7. ✅ Username uniqueness check
8. ✅ Audit logging of all create operations

**Example Request:**
```http
POST /api/admin/users
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "username": "new.employee",
  "password": "SecurePass@2024!",
  "fullname": "New Employee",
  "role": "ROLE_EMPLOYEE",
  "departmentId": 2,
  "organizationId": 1,
  "baseSalary": 50000
}
```

### 3. **Admin-Only User Updates**
**Endpoint:** `PUT /api/admin/users/:id`

**Additional Security Protections:**
- ✅ Admins cannot change their own role from ROLE_ADMIN
- ✅ Admins cannot deactivate their own account
- ✅ All role changes are logged
- ✅ All account activation/deactivation is logged
- ✅ Password changes require strength validation

### 4. **Admin-Only User Deletion**
**Endpoint:** `DELETE /api/admin/users/:id`

**Security:** Only verified administrators can delete users.

---

## 🔒 Authentication & Authorization Flow

```
Request to /api/admin/users
         ↓
[1] verifyToken Middleware
    ├─ Check Authorization header
    ├─ Verify JWT signature
    └─ Decode user data from token
         ↓
[2] withRoleAdmin Middleware
    ├─ Extract user ID from token
    ├─ Query database for user
    ├─ Verify role === "ROLE_ADMIN"
    └─ Add user data to req.headers.user
         ↓
[3] createUser Controller
    ├─ Parse admin ID from headers
    ├─ Query database again to verify admin
    ├─ Check admin role === "ROLE_ADMIN"
    ├─ Check admin.active === true
    ├─ Validate request data
    ├─ Validate password strength
    ├─ Hash password with bcrypt
    ├─ Create new user
    └─ Log action for audit trail
         ↓
[4] Response
    └─ Return created user data
```

---

## 📋 User Roles

The system supports three roles, all managed by admins:

1. **ROLE_ADMIN** - Full system access, can create/modify/delete users
2. **ROLE_MANAGER** - Department management access
3. **ROLE_EMPLOYEE** - Basic employee access

---

## 🔍 Security Audit Logging

All admin actions are logged with the following information:

### User Creation Logs:
```
✅ Admin {username} (ID: {id}) is creating a new user account
✅ Admin {username} successfully created user: {new_username} with role: {role}
```

### Security Violation Logs:
```
⚠️ Security Alert: Non-existent user ID {id} attempted to create user
⚠️ Security Alert: User {username} (ID: {id}, Role: {role}) attempted to create user without admin privileges
⚠️ Security Alert: Inactive admin {username} attempted to create user
```

### User Update Logs:
```
⚠️ Admin {username} is changing user {target_username}'s role from {old_role} to {new_role}
⚠️ Admin {username} is activating/deactivating user {target_username}
```

---

## 🚫 Prevented Actions

The system prevents the following dangerous actions:

1. **Self-Demotion Protection**
   - Admins cannot change their own role to non-admin
   - Prevents accidental lockout

2. **Self-Deactivation Protection**
   - Admins cannot deactivate their own account
   - Ensures at least one active admin exists

3. **Inactive Admin Protection**
   - Inactive admin accounts cannot create/modify users
   - Even with valid JWT tokens

4. **Role Verification**
   - Double-checking role in database (not just JWT)
   - Prevents privilege escalation via token manipulation

---

## ✅ Password Security Requirements

All new users must have passwords that meet these requirements:

- ✅ Minimum 8 characters
- ✅ At least one uppercase letter
- ✅ At least one lowercase letter
- ✅ At least one number
- ✅ At least one special character (@$!%*?&^#())
- ✅ Not in common passwords list
- ✅ Encrypted with bcrypt (10 rounds)

---

## 🎯 Current Seeded Admin Account

**For Initial Setup Only:**

```
Username: admin
Password: Admin@2024!Secure
Role: ROLE_ADMIN
```

⚠️ **IMPORTANT:** Change this password immediately after first login!

---

## 📊 Default Seeded Users

The system seeds with the following accounts (all created by admin):

| Username     | Password               | Role          | Purpose           |
|-------------|------------------------|---------------|-------------------|
| admin       | Admin@2024!Secure      | ROLE_ADMIN    | System admin      |
| manager     | Manager@2024!Strong    | ROLE_MANAGER  | Department manager|
| john.doe    | Employee@2024!John     | ROLE_EMPLOYEE | Regular employee  |
| jane.smith  | Employee@2024!Jane     | ROLE_EMPLOYEE | Regular employee  |

All passwords:
- ✅ Meet security requirements
- ✅ Are bcrypt encrypted
- ✅ Should be changed on first login

---

## 🛠️ How to Create a New User (Admin Only)

### Step 1: Login as Admin
```bash
POST /auth/login
{
  "username": "admin",
  "password": "Admin@2024!Secure"
}
```

**Response includes JWT token**

### Step 2: Create New User
```bash
POST /api/admin/users
Authorization: Bearer <your-jwt-token>

{
  "username": "new.employee",
  "password": "StrongPass@2024!",
  "fullname": "John Smith",
  "role": "ROLE_EMPLOYEE",
  "departmentId": 2,
  "organizationId": 1,
  "baseSalary": 55000
}
```

### Step 3: Verify Creation
```bash
GET /api/admin/users
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 API Endpoints Summary

### Public Endpoints (No Auth Required)
- `POST /auth/login` - User login only

### Admin-Only Endpoints (Requires ROLE_ADMIN)
- `POST /api/admin/users` - Create user
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/users/statistics` - User statistics
- `GET /api/admin/users/department/:id` - Users by department

### Manager Endpoints (Requires ROLE_MANAGER or ROLE_ADMIN)
- Various department management endpoints
- Cannot create/modify/delete users

### Employee Endpoints (Requires ROLE_EMPLOYEE)
- Personal information access
- Cannot create/modify/delete users

---

## 🚨 Security Testing Checklist

Test these scenarios to verify security:

- [ ] ❌ Cannot access `/api/admin/users` without JWT token
- [ ] ❌ Cannot access `/api/admin/users` with employee token
- [ ] ❌ Cannot access `/api/admin/users` with manager token
- [ ] ✅ Can access `/api/admin/users` with admin token
- [ ] ❌ Cannot create user with weak password
- [ ] ❌ Cannot create user with duplicate username
- [ ] ❌ Admin cannot change their own role
- [ ] ❌ Admin cannot deactivate themselves
- [ ] ✅ Admin can create users with all roles
- [ ] ✅ All admin actions are logged

---

## 📝 Audit Trail

Check server logs for security events:

```bash
# Look for admin actions
grep "Admin.*creating" logs/*.log

# Look for security violations
grep "Security Alert" logs/*.log

# Look for role changes
grep "changing user.*role" logs/*.log
```

---

## 🔄 Password Change Policy

Users can change their own passwords, but:
- ✅ Must provide current password
- ✅ New password must meet strength requirements
- ✅ Password is validated against common passwords list
- ✅ Old password verified with bcrypt
- ✅ New password hashed with bcrypt before storage

---

## 🎓 Best Practices

1. **Never share admin credentials**
2. **Change default admin password immediately**
3. **Use strong, unique passwords**
4. **Monitor audit logs regularly**
5. **Review user accounts periodically**
6. **Deactivate accounts instead of deleting when possible**
7. **Keep minimum number of admin accounts**
8. **Implement 2FA for admin accounts (future enhancement)**

---

## 🚀 Future Security Enhancements

Planned improvements:

- [ ] Two-Factor Authentication (2FA) for admin accounts
- [ ] IP whitelisting for admin access
- [ ] Session management and token blacklisting
- [ ] Account lockout after failed login attempts
- [ ] Password history (prevent reuse)
- [ ] Forced password change on first login
- [ ] Admin activity dashboard
- [ ] Email notifications for security events

---

## 📞 Security Contact

For security concerns or to report vulnerabilities:
- Create an issue in the repository
- Contact system administrator
- Review security audit logs

---

**Last Updated:** October 25, 2025  
**Security Level:** HIGH  
**Compliance:** GDPR Ready, SOC 2 Compatible

# Expense Tracking System Update

## Overview
Updated the expense tracking system to implement proper department-based authorization and approval workflows.

## Key Changes

### 1. Database Schema
- **Added `department_id` column to `expenses` table**
  - Foreign key reference to `department` table
  - NULL value means "company-wide" expense
  - Indexed for better query performance

### 2. Admin Capabilities
**Admin can:**
- ✅ Create expenses for ANY department OR company-wide
- ✅ **REQUIRED** to select department when creating expense (dropdown includes "Company-wide" option)
- ✅ View ALL expenses (from all departments and managers)
- ✅ Approve, Reject, or mark as Paid any expense
- ✅ Edit and delete any expense
- ✅ Full authority over all expense operations

**Admin expense creation:**
- Department selection is **REQUIRED**
- Can choose specific department OR "Company-wide (No specific department)"
- All admin-created expenses start with `status: 'pending'` (admin must approve separately)

### 3. Manager Capabilities
**Manager can:**
- ✅ Create expenses for THEIR OWN department ONLY
- ✅ View ONLY their own expenses
- ❌ CANNOT choose department (automatically assigned to their department)
- ❌ CANNOT approve, reject, or change status of expenses
- ❌ All manager expenses require admin approval

**Manager expense creation:**
- Department is **automatically assigned** based on manager's department
- Status is automatically set to `'pending'`
- Must wait for admin approval/rejection/payment
- Receives notification when admin takes action

### 4. Expense Workflow

#### Admin Creates Expense:
```
1. Admin selects department (or company-wide)
2. Expense created with status: 'pending'
3. Admin can approve/reject/mark as paid
```

#### Manager Creates Expense:
```
1. Manager creates expense (department auto-assigned)
2. Expense created with status: 'pending'
3. ONLY ADMIN can approve/reject/mark as paid
4. Manager receives notification of admin action
```

### 5. Expense Tracking Pages

#### Admin Expense Tracking (`/admin/expenses/track`):
- Shows ALL expenses from all departments and all managers
- Shows admin's own expenses
- Displays department column:
  - "Company-wide" for expenses with no department
  - Department name for department-specific expenses
- Action buttons:
  - ✅ Approve (pending → approved)
  - ❌ Reject (pending → rejected)
  - 💰 Mark as Paid (approved → paid)
  - ✏️ Edit
  - 🗑️ Delete

#### Manager Expense Tracking (`/manager/expenses`):
- Shows ONLY manager's own expenses
- Shows department (manager's department)
- Action buttons:
  - 👁️ View
  - ✏️ Edit (can edit description/amount/date only)
  - 🗑️ Delete
  - ❌ NO approve/reject/paid buttons

### 6. Updated Files

#### Backend Files:
1. **`/thesis-fullstack/db/migrations/0010_add_department_to_expenses.sql`**
   - Migration to add department_id column

2. **`/thesis-fullstack/db/schema.js`**
   - Updated expenses table schema

3. **`/thesis-fullstack/modules/admin/controllers/user.admin.controller.js`**
   - Updated `createExpense()` - requires department, assigns to admin user
   - Updated `getAllExpenses()` - includes department info

4. **`/thesis-fullstack/modules/manager/controllers/expense.manager.controller.js`**
   - Updated `createDepartmentExpense()` - auto-assigns manager's department, status pending
   - Updated `getDepartmentExpenses()` - filters by manager's expenses only

#### Frontend Files:
1. **`/c/app/(dashboard)/admin/expenses/create/page.tsx`**
   - Department selection REQUIRED with tooltip
   - Clear "Company-wide" option

2. **`/c/app/(dashboard)/manager/expenses/create/page.tsx`**
   - Removed department selection (auto-assigned)
   - Removed status field
   - Added note: "Requires admin approval"

3. **`/c/app/(dashboard)/admin/expenses/track/page.tsx`**
   - Already has approve/reject/paid functionality
   - Shows department column

### 7. Authorization Matrix

| Action | Admin | Manager |
|--------|-------|---------|
| Create expense for any department | ✅ Yes | ❌ No |
| Create expense for own department | ✅ Yes | ✅ Yes (auto-assigned) |
| Create company-wide expense | ✅ Yes | ❌ No |
| Choose department | ✅ Required | ❌ Auto-assigned |
| View all expenses | ✅ Yes | ❌ No |
| View own expenses | ✅ Yes | ✅ Yes |
| Approve expenses | ✅ Yes | ❌ No |
| Reject expenses | ✅ Yes | ❌ No |
| Mark as Paid | ✅ Yes | ❌ No |
| Edit any expense | ✅ Yes | ❌ No |
| Edit own expense | ✅ Yes | ✅ Yes (limited) |
| Delete any expense | ✅ Yes | ❌ No |
| Delete own expense | ✅ Yes | ✅ Yes |

### 8. Status Flow

```
Manager Creates Expense
         ↓
    [PENDING]
         ↓
   Admin Reviews
         ↓
    ↙         ↘
[APPROVED]  [REJECTED]
    ↓
Admin Marks Paid
    ↓
  [PAID]
```

### 9. Migration Instructions

1. **Run the migration:**
   ```bash
   cd thesis-fullstack
   node db/migrate.js
   ```

2. **Restart backend server:**
   ```bash
   npm start
   ```

3. **Clear browser cache** (if needed)

4. **Test the flow:**
   - Login as admin → Create expense → Select department
   - Login as manager → Create expense → See auto-department assignment
   - Login as admin → View all expenses → Approve/Reject manager expenses

### 10. Important Notes

⚠️ **Breaking Changes:**
- Manager expenses NO LONGER auto-approved
- Department selection REQUIRED for admin
- Manager CANNOT choose department (auto-assigned)

✅ **Benefits:**
- Clear separation of authority
- Proper approval workflow
- Better expense tracking by department
- Admin has full control and oversight

## Testing Checklist

- [ ] Admin can create expense with department selection
- [ ] Admin can create company-wide expense
- [ ] Admin can see all expenses
- [ ] Admin can approve/reject/mark as paid
- [ ] Manager can create expense (department auto-assigned)
- [ ] Manager can only see own expenses
- [ ] Manager CANNOT approve/reject/change status
- [ ] Manager receives notification when admin acts on expense
- [ ] Department column shows correctly in tracking pages
- [ ] "Company-wide" displays for null department_id

## Support

If you encounter any issues, check:
1. Database migration ran successfully
2. Backend server restarted
3. Frontend cache cleared
4. User has correct role (ROLE_ADMIN or ROLE_MANAGER)

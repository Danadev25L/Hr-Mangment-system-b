# Complete Localization Plan for HR Management System

## Overview
This document outlines the comprehensive localization strategy for translating ALL static text across the entire HR Management System into English, Arabic, and Kurdish.

## Current Status
- ✅ **Translation Infrastructure**: Already using `next-intl` with proper structure
- ✅ **Translation Files**: en.json, ar.json, ku.json exist
- ✅ **New Translation Keys Added**: 240+ new keys for Attendance, Salary, and Profile sections

## Translation Keys Added (Step 1 - COMPLETED)

### Attendance Section (100+ keys)
- Status translations: Present, Absent, Late, Early Departure, On Leave, Not Marked
- Time fields: Check In, Check Out, Working Hours, Break Duration
- Actions: Mark Check-In, Mark Check-Out, Mark Absent, Edit Attendance
- Filters: By Status, By Department, Date Ranges
- Validation: Invalid time, Future date errors, Missing fields
- Success/Error messages for all operations
- Bulk actions and export functionality

### Salary Management (80+ keys)
- Payroll terms: Base Salary, Gross, Net, Final Amount
- Components: Bonuses, Allowances, Deductions, Overtime
- Status: Draft, Calculated, Approved, Paid
- Actions: Calculate, Approve, Pay, Download Payslip
- Adjustments: Types, Amounts, Reasons
- Reports: By Department, Monthly, Annual

### Profile Section (60+ keys)
- Personal Info: Name, Email, Phone, Date of Birth, Gender, Address
- Employment: Job Title, Department, Join Date, Employment Type
- Security: Change Password, 2FA, Session Management
- Notifications: Email, Push, SMS preferences
- Language & Timezone settings

## Remaining Translation Work

### Admin Section (High Priority)
- [ ] Dashboard (QuickStats, Charts, Tables, Calendar, Activity)
- [ ] Employees (List, Add, Edit, View, Delete)
- [ ] Attendance (Already has keys, need to apply them)
- [ ] Applications (List, Add, Edit, View, Approve/Reject)
- [ ] Expenses (List, Add, Edit, View, Approve/Reject)
- [ ] Announcements (List, Add, Edit, View, Activate/Deactivate)
- [ ] Holidays (Already translated - verify completeness)
- [ ] Departments (Already translated - verify completeness)
- [ ] Salary Management (Already has keys, need to apply them)

### Manager Section (Medium Priority)
- [ ] Manager Dashboard (Team stats, Pending approvals)
- [ ] Team Overview
- [ ] Team Attendance
- [ ] Team Applications (Approve/Reject)
- [ ] Team Expenses (Approve/Reject)
- [ ] Department Announcements
- [ ] Pending Corrections

### Employee Section (Medium Priority)
- [ ] Employee Dashboard (Personal stats, Quick actions)
- [ ] My Profile (Already has keys, need to apply them)
- [ ] My Attendance (Already has keys, need to apply them)
- [ ] Attendance Records
- [ ] My Corrections
- [ ] My Applications
- [ ] My Expenses
- [ ] Company Holidays (Use existing keys)
- [ ] Announcements (View only)
- [ ] My Payslips

### Shared Components (High Priority)
- [ ] Navigation Sidebar (All menu items)
- [ ] Top Header (User menu, notifications, language selector)
- [ ] Table Components (Pagination, Sort, Filter)
- [ ] Modal Dialogs (Confirm, Delete, Approve, Reject)
- [ ] Form Components (Labels, Placeholders, Validation)
- [ ] Date/Time Pickers
- [ ] Search Bars
- [ ] Status Badges
- [ ] Action Buttons
- [ ] Empty States
- [ ] Loading States
- [ ] Error Pages (404, 403, 500)

## Implementation Strategy

### Phase 1: Apply Existing Keys (CURRENT)
1. **Attendance Pages** - Use the 100+ keys just added
2. **Salary Pages** - Use the 80+ keys just added
3. **Profile Pages** - Use the 60+ keys just added

### Phase 2: Add Missing Keys
4. **Dashboard Keys** - Stats, charts, quick actions
5. **Employee Management Keys** - Forms, validation, actions
6. **Applications Keys** - Types, status, workflows
7. **Expenses Keys** - Categories, amounts, approval
8. **Common Component Keys** - Tables, modals, forms

### Phase 3: Translate to Arabic & Kurdish
9. **Arabic Translation (ar.json)** - All 500+ keys
10. **Kurdish Translation (ku.json)** - All 500+ keys

### Phase 4: Testing & Verification
11. **Admin Section** - Test all pages in 3 languages
12. **Manager Section** - Test all pages in 3 languages
13. **Employee Section** - Test all pages in 3 languages
14. **RTL Layout** - Verify Arabic displays properly
15. **Missing Keys** - Check console for warnings

## File-by-File Translation Plan

### Admin Files (15 files)
1. `src/app/[locale]/admin/dashboard/page.tsx`
2. `src/app/[locale]/admin/employees/page.tsx`
3. `src/app/[locale]/admin/employees/add/page.tsx`
4. `src/app/[locale]/admin/employees/[id]/page.tsx`
5. `src/app/[locale]/admin/employees/[id]/edit/page.tsx`
6. `src/app/[locale]/admin/attendance/page.tsx`
7. `src/app/[locale]/admin/attendance/manage/page.tsx`
8. `src/components/attendance/AttendanceListPage.tsx`
9. `src/app/[locale]/admin/applications/page.tsx`
10. `src/app/[locale]/admin/expenses/page.tsx`
11. `src/app/[locale]/admin/announcements/page.tsx`
12. `src/app/[locale]/admin/departments/page.tsx`
13. `src/app/[locale]/admin/salary/page.tsx`
14. `src/app/[locale]/admin/salary/manage/page.tsx`
15. `src/app/[locale]/admin/salary/adjustments/page.tsx`

### Manager Files (8 files)
1. `src/app/[locale]/manager/dashboard/page.tsx`
2. `src/app/[locale]/manager/team/page.tsx`
3. `src/app/[locale]/manager/team-attendance/page.tsx`
4. `src/app/[locale]/manager/applications/page.tsx`
5. `src/app/[locale]/manager/expenses/page.tsx`
6. `src/app/[locale]/manager/announcements/page.tsx`
7. `src/app/[locale]/manager/corrections/page.tsx`
8. `src/app/[locale]/manager/profile/page.tsx`

### Employee Files (10 files)
1. `src/app/[locale]/employee/dashboard/page.tsx`
2. `src/app/[locale]/employee/profile/page.tsx`
3. `src/app/[locale]/employee/attendance/page.tsx`
4. `src/app/[locale]/employee/attendance-records/page.tsx`
5. `src/app/[locale]/employee/corrections/page.tsx`
6. `src/app/[locale]/employee/applications/page.tsx`
7. `src/app/[locale]/employee/expenses/page.tsx`
8. `src/app/[locale]/employee/holidays/page.tsx`
9. `src/app/[locale]/employee/announcements/page.tsx`
10. `src/app/[locale]/employee/payslips/page.tsx`

### Shared Components (20+ files)
1. Navigation sidebars (Admin, Manager, Employee)
2. Header component
3. Table components
4. Modal components
5. Form components
6. Date pickers
7. Status badges
8. Action buttons
9. Empty states
10. Loading states
11. Error pages

## Pattern for Translation

### Before (Hardcoded):
```tsx
<h1>Employee Attendance</h1>
<Button>Check In</Button>
<Tag color="success">Present</Tag>
<message>Employee checked in successfully</message>
```

### After (Translated):
```tsx
const t = useTranslations();

<h1>{t('attendance.title')}</h1>
<Button>{t('attendance.checkIn')}</Button>
<Tag color="success">{t('attendance.present')}</Tag>
<message>{t('attendance.checkInSuccess')}</message>
```

## Progress Tracking

### Completed ✅
- [x] Analyzed localization structure
- [x] Added 240+ translation keys to en.json
- [x] Fixed duplicate key errors
- [x] Created comprehensive plan

### In Progress 🔄
- [ ] Applying translations to Attendance pages (Task 7)
- [ ] Adding more translation keys as needed

### Not Started ⏳
- [ ] Manager section translations
- [ ] Employee section translations
- [ ] Arabic translations (ar.json)
- [ ] Kurdish translations (ku.json)
- [ ] Testing and verification

## Next Actions

I will now systematically:
1. ✅ Start with AttendanceListPage.tsx (most complex, already debugged)
2. ✅ Then do all Admin pages
3. ✅ Then Manager pages
4. ✅ Then Employee pages
5. ✅ Then Shared components
6. ✅ Add Arabic translations
7. ✅ Add Kurdish translations
8. ✅ Test everything

## Estimated Completion
- **Translation Keys**: 500-600 keys total
- **Files to Update**: 50+ files
- **Time per File**: 5-10 minutes
- **Total Effort**: Systematic and thorough

---

**Note**: I have complete access to continue this work. I will proceed systematically through each file, replacing all hardcoded strings with proper translation keys using the `t()` function from `useTranslations()` hook.

# 🔍 Debugging Edit Check-In Issue

## Current Problem
Getting 400 Bad Request when trying to edit check-in time.
Error message suggests "Attendance record not found"

## 🧪 Test Steps

### 1. Check Backend Console Logs
After attempting edit, look for these log lines:
```
=== EDIT CHECK-IN DEBUG ===
Request body: { ... }
attendanceId: ... type: ...
employeeId: ... type: ...
date: ...
```

### 2. Check Frontend Console Logs  
In browser console (F12), look for:
```
=== FRONTEND EDIT CHECK-IN ===
selectedEmployee: { ... }
selectedEmployee.attendance: { ... }
selectedEmployee.attendance?.id: ...
Using attendanceId: ... OR Using employeeId + date: ...
Final requestData: { ... }
```

## 🔎 What to Check

### If `attendanceId` is being sent:
- ✅ Check: Is it a number?
- ✅ Check: Does it match an actual record in `attendance_records` table?
- ✅ Run SQL: `SELECT * FROM attendance_records WHERE id = <that_id>;`

### If `employeeId + date` is being sent:
- ✅ Check: Is employeeId a number?
- ✅ Check: Is date in correct format (YYYY-MM-DD)?
- ✅ Run SQL: `SELECT * FROM attendance_records WHERE user_id = <employeeId> AND date::date = '<date>'::date;`

## 💡 Common Issues

### Issue 1: attendance.id is undefined
**Symptoms:** Frontend log shows `selectedEmployee.attendance?.id: undefined`
**Solution:** The employee doesn't have an attendance record yet. Need to check-in first.

### Issue 2: attendanceId is string instead of number
**Symptoms:** Backend log shows `attendanceId: "123" type: string`
**Solution:** Frontend should send as number, or backend parseInt is failing

### Issue 3: Date format mismatch
**Symptoms:** Record exists but not found by date search
**Solution:** Check date format being sent vs. database date format

### Issue 4: Record genuinely doesn't exist
**Symptoms:** Both searches return 0 records
**Solution:** Employee hasn't checked in yet - use check-in instead of edit

## 🛠️ Manual Test with cURL

### Test with attendanceId:
```bash
curl -X PUT http://localhost:3001/api/admin/attendance/edit-checkin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "attendanceId": 123,
    "checkInTime": "2025-11-06 08:30:00"
  }'
```

### Test with employeeId + date:
```bash
curl -X PUT http://localhost:3001/api/admin/attendance/edit-checkin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employeeId": 45,
    "date": "2025-11-06",
    "checkInTime": "2025-11-06 08:30:00"
  }'
```

## 📊 Check Database Directly

### See all attendance records:
```sql
SELECT id, user_id, date, check_in, check_out, status 
FROM attendance_records 
ORDER BY date DESC 
LIMIT 10;
```

### Find specific employee's records:
```sql
SELECT id, user_id, date, check_in, check_out, status 
FROM attendance_records 
WHERE user_id = <employee_id>
AND date >= CURRENT_DATE - INTERVAL '7 days';
```

### Check if ID exists:
```sql
SELECT * FROM attendance_records WHERE id = <attendance_id>;
```

## ✅ Success Indicators

You should see in backend console:
```
Found record with ID: 123
Check-in time updated successfully
```

And get response:
```json
{
  "success": true,
  "message": "Check-in time updated successfully",
  "attendance": { ... }
}
```

## 🚨 Next Steps Based on Logs

1. **If attendanceId is undefined in frontend:**
   - The employee row doesn't have attendance data
   - Need to check-in first before editing

2. **If record not found in backend:**
   - Check database directly
   - Verify the ID actually exists
   - Check if date range is correct

3. **If validation error:**
   - Check that all required fields are sent
   - Verify data types match (number vs string)

---

**Copy the console logs here and we can diagnose the exact issue!**
